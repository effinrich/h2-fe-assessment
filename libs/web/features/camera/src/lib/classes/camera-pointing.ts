import { StateNode } from "tldraw"

export class CameraPointing extends StateNode {
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
