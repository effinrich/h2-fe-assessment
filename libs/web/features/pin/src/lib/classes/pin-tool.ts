import { atom, StateNode, type TLStateNodeConstructor } from "tldraw"

import type { Settle } from "../pin-settle"

import { PIN_SHAPE, PIN_TOOL_ID } from "../consts"
import { claimFirstUseHint } from "../first-use-hint/first-use-hint"
import { PinIdle } from "./pin-idle"
import { createPinPointing } from "./pin-pointing"

export class PinTool extends StateNode {
  static override id = PIN_TOOL_ID
  readonly hint = atom("pin first-use hint", false)
}

export function createPinTool(settle: Settle): TLStateNodeConstructor {
  const PinPointing = createPinPointing(settle)
  return class extends PinTool {
    static override initial = "idle"
    static override children = () => [PinIdle, PinPointing]
    override shapeType = PIN_SHAPE

    override onEnter() {
      if (claimFirstUseHint()) this.hint.set(true)
    }

    override onExit() {
      this.hint.set(false)
    }
  }
}
