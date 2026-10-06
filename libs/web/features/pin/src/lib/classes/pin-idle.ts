import { StateNode, type TLPointerEventInfo } from "tldraw"

export class PinIdle extends StateNode {
  static override id = "idle"

  override onEnter() {
    this.editor.setCursor({ type: "cross", rotation: 0 })
  }

  override onPointerDown(info: TLPointerEventInfo) {
    this.parent.transition("pointing", info)
  }

  override onCancel() {
    this.editor.setCurrentTool("select")
  }
}
