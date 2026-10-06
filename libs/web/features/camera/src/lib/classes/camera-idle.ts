import { StateNode, type TLKeyboardEventInfo, type TLPointerEventInfo } from "tldraw"

import { dropDefaultFrame } from "../crop-frame-creation"

export class CameraIdle extends StateNode {
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
