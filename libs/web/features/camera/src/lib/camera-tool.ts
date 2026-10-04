import {
  atom,
  createShapeId,
  StateNode,
  type BoxModel,
  type Editor,
  type TLKeyboardEventInfo,
  type TLPointerEventInfo
} from "tldraw"

import type { CropFrameShape } from "./types"

import { CAMERA_TOOL_ID, CROP_FRAME } from "./consts"
import { claimFirstUseHint } from "./first-use-hint"
import { defaultFrameBox, frameInsertIndex, isBelowMinSize, normaliseBox } from "./utils"

function cropFrameInsertIndex(editor: Editor) {
  const siblings = editor
    .getSortedChildIdsForParent(editor.getCurrentPageId())
    .flatMap((childId) => {
      const shape = editor.getShape(childId)
      if (!shape) return []
      const isMark = shape.type !== CROP_FRAME && !editor.isShapeOrAncestorLocked(shape)
      return [{ index: shape.index, isMark }]
    })
  return frameInsertIndex(siblings)
}

function createCropFrame(editor: Editor, box: BoxModel) {
  const id = createShapeId()
  editor.markHistoryStoppingPoint("crop-frame")
  editor.createShape<CropFrameShape>({
    id,
    type: CROP_FRAME,
    x: box.x,
    y: box.y,
    index: cropFrameInsertIndex(editor),
    props: { w: box.w, h: box.h }
  })
  editor.select(id)
  // Always back to select, even with tool lock: the frame's export actions
  // only show while it is selected.
  editor.setCurrentTool("select")
}

/** The keyboard path: a default-size frame centred in the viewport. */
export function dropDefaultFrame(editor: Editor) {
  createCropFrame(editor, defaultFrameBox(editor.getViewportPageBounds(), editor.getZoomLevel()))
}

class CameraIdle extends StateNode {
  static override id = "idle"

  override onEnter() {
    this.editor.setCursor({ type: "cross", rotation: 0 })
  }

  override onPointerDown(info: TLPointerEventInfo) {
    if (info.button !== 0) return
    this.parent.transition("pointing")
  }

  override onKeyDown(info: TLKeyboardEventInfo) {
    const hasModifier = info.ctrlKey || info.metaKey || info.altKey || info.shiftKey
    if (info.key === "Enter" && !hasModifier) dropDefaultFrame(this.editor)
  }

  override onCancel() {
    this.editor.setCurrentTool("select")
  }
}

class CameraPointing extends StateNode {
  static override id = "pointing"

  override onPointerMove() {
    if (this.editor.inputs.getIsDragging()) this.parent.transition("dragging")
  }

  override onPointerUp() {
    this.parent.transition("idle")
  }

  override onCancel() {
    this.parent.transition("idle")
  }

  override onInterrupt() {
    this.parent.transition("idle")
  }
}

export class CameraDragging extends StateNode {
  static override id = "dragging"

  /** The in-flight crop box in page space; read by `CropMarquee`. */
  readonly marquee = atom<BoxModel | null>("crop marquee", null)

  override onEnter() {
    this.editor.getStateDescendant<CameraTool>(CAMERA_TOOL_ID)?.hint.set(false)
    this.updateMarquee()
  }

  override onPointerMove() {
    this.updateMarquee()
  }

  override onTick({ elapsed }: { elapsed: number }) {
    this.editor.edgeScrollManager.updateEdgeScrolling(elapsed)
    this.updateMarquee()
  }

  override onPointerUp() {
    this.complete()
  }

  override onComplete() {
    this.complete()
  }

  override onCancel() {
    this.parent.transition("idle")
  }

  override onInterrupt() {
    this.parent.transition("idle")
  }

  override onExit() {
    this.marquee.set(null)
  }

  private updateMarquee() {
    const { inputs } = this.editor
    this.marquee.set(normaliseBox(inputs.getOriginPagePoint(), inputs.getCurrentPagePoint()))
  }

  private complete() {
    const box = this.marquee.get()
    if (!box || isBelowMinSize(box, this.editor.getZoomLevel())) {
      this.parent.transition("idle")
      return
    }
    createCropFrame(this.editor, box)
  }
}

export class CameraTool extends StateNode {
  static override id = CAMERA_TOOL_ID
  static override initial = "idle"
  static override isLockable = false
  static override children = () => [CameraIdle, CameraPointing, CameraDragging]

  /** Whether the first-use hint shows; read by `FirstUseHint`. */
  readonly hint = atom("camera first-use hint", false)

  override onEnter() {
    if (claimFirstUseHint()) this.hint.set(true)
  }

  override onExit() {
    this.hint.set(false)
  }
}
