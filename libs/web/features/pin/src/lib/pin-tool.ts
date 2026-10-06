import { StateNode, createShapeId, type TLPointerEventInfo } from "tldraw"

import { PIN_TYPE } from "./pin-shape-util"

/** Creates a pin at the pointer and hands off to translating, so the pin follows the pointer until release. */
export class PinTool extends StateNode {
  static override id = PIN_TYPE

  override onEnter() {
    this.editor.setCursor({ type: "cross", rotation: 0 })
  }

  override onPointerDown(info: TLPointerEventInfo) {
    const point = this.editor.inputs.getCurrentPagePoint()
    const id = createShapeId()
    this.editor.markHistoryStoppingPoint()
    this.editor.createShape({ id, type: PIN_TYPE, x: point.x, y: point.y })
    this.editor.setSelectedShapes([id])
    this.editor.setCurrentTool("select.translating", {
      ...info,
      target: "shape",
      shape: this.editor.getShape(id),
      isCreating: true,
      onInteractionEnd: PIN_TYPE,
      onCreate: () => this.editor.setCurrentTool(PIN_TYPE)
    })
  }
}
