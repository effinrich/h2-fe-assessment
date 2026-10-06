import { atom, Box, createShapeId, getIndexBetween, StateNode, type Editor } from "tldraw"

import type { CropFrameShape } from "./types"

import { CAMERA_TOOL_ID, CROP_FRAME, MIN_FRAME_SCREEN_PX } from "./consts"

/**
 * Just under the lowest unlocked mark: above the locked PDF pages, so a click
 * inside the (filled) frame selects it, but never over a mark's own hit area.
 */
function frameIndex(editor: Editor) {
  const shapes = editor
    .getSortedChildIdsForParent(editor.getCurrentPageId())
    .flatMap((id) => editor.getShape(id) ?? [])
  const lowestMark = shapes.findIndex(
    (shape) => shape.type !== CROP_FRAME && !editor.isShapeOrAncestorLocked(shape)
  )
  if (lowestMark === -1) return undefined
  return getIndexBetween(shapes[lowestMark - 1]?.index, shapes[lowestMark]?.index)
}

class CameraIdle extends StateNode {
  static override id = "idle"

  override onPointerDown() {
    this.parent.transition("pointing")
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
}

export class CameraDragging extends StateNode {
  static override id = "dragging"

  /** The box being dragged out, in page space; `CropMarquee` draws it. */
  readonly box = atom("crop marquee", new Box())

  override onEnter() {
    this.update()
  }

  override onPointerMove() {
    this.update()
  }

  override onPointerUp() {
    const { editor } = this
    const box = this.box.get()
    if (Math.min(box.w, box.h) * editor.getZoomLevel() < MIN_FRAME_SCREEN_PX) {
      this.parent.transition("idle")
      return
    }
    const id = createShapeId()
    editor.markHistoryStoppingPoint("create crop frame")
    editor.createShape<CropFrameShape>({
      id,
      type: CROP_FRAME,
      x: box.x,
      y: box.y,
      index: frameIndex(editor),
      props: { w: box.w, h: box.h }
    })
    editor.select(id)
    // The frame's export toolbar only shows under the select tool.
    editor.setCurrentTool("select")
  }

  private update() {
    const { inputs } = this.editor
    this.box.set(Box.FromPoints([inputs.getOriginPagePoint(), inputs.getCurrentPagePoint()]))
  }
}

export class CameraTool extends StateNode {
  static override id = CAMERA_TOOL_ID
  static override initial = "idle"
  static override children = () => [CameraIdle, CameraPointing, CameraDragging]

  override onEnter() {
    this.editor.setCursor({ type: "cross", rotation: 0 })
  }

  override onExit() {
    this.editor.setCursor({ type: "default", rotation: 0 })
  }

  override onInterrupt() {
    this.editor.setCurrentTool("select")
  }

  override onCancel() {
    this.editor.setCurrentTool("select")
  }
}
