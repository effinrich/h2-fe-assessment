import { atom, Box, copyAs, exportAs, StateNode } from "tldraw"

export const CAMERA_TOOL_ID = "camera"

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

  // On release, export everything under the box as a PNG cropped to it; ctrl copies instead.
  override onPointerUp() {
    const { editor } = this
    const box = this.box.get()
    const ids = editor
      .getCurrentPageShapes()
      .filter((shape) => {
        const bounds = editor.getShapeMaskedPageBounds(shape)
        return bounds !== undefined && box.includes(bounds)
      })
      .map((shape) => shape.id)

    if (ids.length) {
      if (editor.inputs.getCtrlKey()) void copyAs(editor, ids, { format: "png", bounds: box })
      else void exportAs(editor, ids, { format: "png", name: "Screenshot", bounds: box })
    }
    editor.setCurrentTool("select")
  }

  override onCancel() {
    this.editor.setCurrentTool("select")
  }

  private update() {
    const { inputs } = this.editor
    this.box.set(Box.FromPoints([inputs.getOriginPagePoint(), inputs.getCurrentPagePoint()]))
  }
}

/** tldraw's screenshot-tool example: drag a box, release to export it. */
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
