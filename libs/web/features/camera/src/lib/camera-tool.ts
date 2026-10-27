import { atom, Box, StateNode } from "tldraw"

import { CROP_TYPE } from "./crop-shape-util"

export const CAMERA_TOOL_ID = "camera"

// A drag shorter than this is a click, not a crop.
const MIN_SIZE = 8

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

  override onCancel() {
    this.parent.transition("idle")
  }
}

export class CameraDragging extends StateNode {
  static override id = "dragging"

  /** The box being dragged out, in page space; `ScreenshotBox` draws it. */
  readonly box = atom("screenshot brush", new Box())

  override onEnter() {
    this.update()
  }

  override onPointerMove() {
    this.update()
  }

  // On release the drag becomes a crop shape: a region that stays on the
  // canvas, can be resized from its corners and exported from there.
  override onPointerUp() {
    const { editor } = this
    const box = this.box.get()
    editor.setCurrentTool("select")
    if (box.w < MIN_SIZE || box.h < MIN_SIZE) return

    const before = new Set(editor.getCurrentPageShapes().map((shape) => shape.id))
    editor.createShape({
      type: CROP_TYPE,
      x: box.x,
      y: box.y,
      props: { w: box.w, h: box.h }
    })
    const crop = editor.getCurrentPageShapes().find((shape) => !before.has(shape.id))
    if (crop) editor.select(crop)
  }

  override onCancel() {
    this.editor.setCurrentTool("select")
  }

  private update() {
    const { inputs } = this.editor
    this.box.set(Box.FromPoints([inputs.getOriginPagePoint(), inputs.getCurrentPagePoint()]))
  }
}

/** The camera tool (`C`): drag out a crop, then export it from the shape. */
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
    this.parent.transition("select", {})
  }

  override onCancel() {
    this.parent.transition("select", {})
  }
}
