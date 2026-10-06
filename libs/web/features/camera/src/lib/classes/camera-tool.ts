import { atom, StateNode } from "tldraw"

import { CAMERA_TOOL_ID } from "../consts"
import { claimFirstUseHint } from "../first-use-hint/first-use-hint"
import { CameraDragging } from "./camera-dragging"
import { CameraIdle } from "./camera-idle"
import { CameraPointing } from "./camera-pointing"

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
