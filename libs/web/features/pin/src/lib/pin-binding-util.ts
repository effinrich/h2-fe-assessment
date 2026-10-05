import {
  BindingUtil,
  vecModelValidator,
  type BindingOnShapeChangeOptions,
  type BindingOnShapeDeleteOptions,
  type RecordProps,
  type TLShapeId
} from "tldraw"

import type { PinBinding } from "./types"

import { PIN_BINDING } from "./consts"
import { deleteOrphans, follow, rebaseline } from "./pin-follow"
import { classifyChange } from "./utils"

/**
 * Pin bindings run from a pin to a held shape, with the shape's page origin
 * minus the pin point as `offset`. A pure translation of a held shape drives
 * its connected group; a resize or rotation re-baselines its offset instead.
 * The pin's own moves drive nothing: dragging a pin moves only the pin.
 */
export class PinBindingUtil extends BindingUtil<PinBinding> {
  static override type = PIN_BINDING
  static override props: RecordProps<PinBinding> = { offset: vecModelValidator }

  private readonly drivers = new Set<TLShapeId>()
  private readonly reshaped = new Set<TLShapeId>()
  private readonly orphanCandidates = new Set<TLShapeId>()

  override getDefaultProps(): Partial<PinBinding["props"]> {
    return { offset: { x: 0, y: 0 } }
  }

  override onAfterChangeToShape({
    shapeBefore,
    shapeAfter,
    reason
  }: BindingOnShapeChangeOptions<PinBinding>) {
    const change = reason === "ancestry" ? "translate" : classifyChange(shapeBefore, shapeAfter)
    if (change === "translate") this.drivers.add(shapeAfter.id)
    if (change === "reshape") this.reshaped.add(shapeAfter.id)
  }

  override onBeforeDeleteToShape({ binding }: BindingOnShapeDeleteOptions<PinBinding>) {
    this.orphanCandidates.add(binding.fromId)
  }

  /** Writes made here come back as changes in the next round and solve to no-ops. */
  override onOperationComplete() {
    const drivers = [...this.drivers]
    const reshaped = new Set(this.reshaped)
    const orphans = [...this.orphanCandidates]
    this.drivers.clear()
    this.reshaped.clear()
    this.orphanCandidates.clear()

    rebaseline(this.editor, reshaped)
    follow(this.editor, drivers, reshaped)
    deleteOrphans(this.editor, orphans)
  }
}
