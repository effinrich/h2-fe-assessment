import { atom, StateNode, type BoxModel } from "tldraw"

import type { CameraTool } from "./camera-tool"

import { CAMERA_TOOL_ID } from "../consts"
import { isBelowMinSize, normaliseBox } from "../utils/utils"
import { createCropFrame } from "./camera-tool-helpers"

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
