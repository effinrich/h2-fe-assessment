import {
  createShapeId,
  StateNode,
  type TLPointerEventInfo,
  type TLShape,
  type TLShapeId,
  type TLStateNodeConstructor
} from "tldraw"

import type { Settle } from "../pin-settle"
import type { PinTool } from "./pin-tool"

import { PIN_SHAPE, PIN_TOOL_ID } from "../consts"
import { pinOrigin } from "../utils"

/** What `select.translating` reads on enter; tldraw doesn't export the type. */
interface TranslatingCreateInfo {
  target: "shape"
  shape: TLShape
  onInteractionEnd: string
  isCreating: true
  creatingMarkId: string
}

/**
 * Press places the pin (tip on the pointer), settles and selects it in one
 * history step. Release finishes; dragging first hands the new pin to tldraw's
 * translating state as a creation, so the drag stays in that same step and
 * the pin settles again where it is dropped.
 */
export function createPinPointing(settle: Settle): TLStateNodeConstructor {
  return class PinPointing extends StateNode {
    static override id = "pointing"

    private markId = ""
    private pinId: TLShapeId | null = null

    override onEnter() {
      this.editor.getStateDescendant<PinTool>(PIN_TOOL_ID)?.hint.set(false)
      const { editor } = this
      const id = createShapeId()
      const origin = pinOrigin(editor.inputs.getOriginPagePoint())
      this.markId = editor.markHistoryStoppingPoint(`creating:${id}`)
      editor.run(() => {
        editor.createShape({ id, type: PIN_SHAPE, x: origin.x, y: origin.y })
        settle(editor, [id])
        editor.select(id)
      })
      this.pinId = id
    }

    override onPointerMove(info: TLPointerEventInfo) {
      const { editor } = this
      const shape = this.pinId && editor.getShape(this.pinId)
      if (!shape || !editor.inputs.getIsDragging()) return
      editor.setCurrentTool("select.translating", {
        ...info,
        target: "shape",
        shape,
        onInteractionEnd: PIN_TOOL_ID,
        isCreating: true,
        creatingMarkId: this.markId
      } satisfies TLPointerEventInfo & TranslatingCreateInfo)
    }

    override onPointerUp() {
      if (this.editor.getInstanceState().isToolLocked) {
        this.parent.transition("idle")
      } else {
        this.editor.setCurrentTool("select")
      }
    }

    override onCancel() {
      this.cancel()
    }

    override onInterrupt() {
      this.cancel()
    }

    private cancel() {
      this.editor.bailToMark(this.markId)
      this.parent.transition("idle")
    }
  }
}
