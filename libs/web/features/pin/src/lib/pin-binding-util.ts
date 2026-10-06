import {
  BindingUtil,
  Vec,
  lerp,
  type BindingOnShapeChangeOptions,
  type BindingOnShapeDeleteOptions,
  type TLBinding,
  type TLShapeId,
  type TLShapePartial,
  type VecModel
} from "tldraw"

import { PIN_TYPE, type PinShape } from "./pin-shape-util"

declare module "tldraw" {
  export interface TLGlobalBindingPropsMap {
    [PIN_TYPE]: { anchor: VecModel }
  }
}

type PinBinding = TLBinding<typeof PIN_TYPE>

const SOLVER_ITERATIONS = 30

/** Keeps every pin at the same spot on each shape it holds, so moving one pinned shape moves the rest. */
export class PinBindingUtil extends BindingUtil<PinBinding> {
  static override type = PIN_TYPE

  override getDefaultProps() {
    return { anchor: { x: 0.5, y: 0.5 } }
  }

  private changedToShapes = new Set<TLShapeId>()

  // Collect changes per shape; solve the network once per operation.
  override onAfterChangeToShape({ binding, shapeAfter }: BindingOnShapeChangeOptions<PinBinding>) {
    this.changedToShapes.add(binding.toId)
    const pin = this.editor.getShape<PinShape>(binding.fromId)
    if (pin && pin.parentId !== shapeAfter.parentId) {
      this.editor.reparentShapes([pin.id], shapeAfter.parentId)
    }
  }

  override onBeforeDeleteToShape({ binding }: BindingOnShapeDeleteOptions<PinBinding>) {
    this.editor.deleteShape(binding.fromId)
  }

  override onOperationComplete() {
    if (this.changedToShapes.size === 0) return
    const fixed = this.changedToShapes
    const { initial, deltas } = this.collectNetwork([...fixed])
    const solved = relax(initial, deltas, fixed)

    const updates: TLShapePartial[] = []
    for (const [id, position] of solved) {
      if (Vec.Sub(position, initial.get(id) ?? position).len2() <= 0.01) continue
      const shape = this.editor.getShape(id)
      if (!shape) continue
      const { x, y } = this.editor.getPointInParentSpace(id, position)
      updates.push({ id, type: shape.type, x, y })
    }

    // Each update triggers another pass; the set clears once a pass moves nothing.
    if (updates.length === 0) this.changedToShapes.clear()
    else this.editor.updateShapes(updates)
  }

  /** Walks out from the changed shapes across pin bindings: every connected shape's page origin and its target offset to each pin. */
  private collectNetwork(toCheck: TLShapeId[]) {
    const initial = new Map<TLShapeId, VecModel>()
    const deltas = new Map<TLShapeId, Map<TLShapeId, VecModel>>()
    const seen = new Set<TLShapeId>()
    const addDelta = (a: TLShapeId, b: TLShapeId, delta: VecModel) => {
      if (!deltas.has(a)) deltas.set(a, new Map())
      if (!deltas.has(b)) deltas.set(b, new Map())
      deltas.get(a)?.set(b, delta)
      deltas.get(b)?.set(a, { x: -delta.x, y: -delta.y })
    }
    const origin = (id: TLShapeId) =>
      this.editor.getShapePageTransform(id).applyToPoint({ x: 0, y: 0 })

    while (toCheck.length) {
      const shapeId = toCheck.pop()
      if (!shapeId || seen.has(shapeId) || !this.editor.getShape(shapeId)) continue
      seen.add(shapeId)

      for (const toBinding of this.editor.getBindingsToShape<PinBinding>(shapeId, PIN_TYPE)) {
        const pinId = toBinding.fromId
        if (seen.has(pinId) || !this.editor.getShape(pinId)) continue
        seen.add(pinId)
        initial.set(pinId, origin(pinId))

        for (const binding of this.editor.getBindingsFromShape<PinBinding>(pinId, PIN_TYPE)) {
          const bounds = this.editor.getShapeGeometry(binding.toId).bounds
          const anchor = this.editor.getShapePageTransform(binding.toId).applyToPoint({
            x: lerp(bounds.minX, bounds.maxX, binding.props.anchor.x),
            y: lerp(bounds.minY, bounds.maxY, binding.props.anchor.y)
          })
          const shapeOrigin = origin(binding.toId)
          initial.set(binding.toId, shapeOrigin)
          addDelta(pinId, binding.toId, Vec.Sub(anchor, shapeOrigin))
          if (!seen.has(binding.toId)) toCheck.push(binding.toId)
        }
      }
    }
    return { initial, deltas }
  }
}

/** A small constraint solver: changed shapes stay put; everything else relaxes toward its target offsets. */
function relax(
  initial: Map<TLShapeId, VecModel>,
  deltas: Map<TLShapeId, Map<TLShapeId, VecModel>>,
  fixed: Set<TLShapeId>
) {
  const current = new Map(initial)
  for (let i = 0; i < SOLVER_ITERATIONS; i++) {
    const moves = new Map<TLShapeId, VecModel[]>()
    for (const [aId, targets] of deltas) {
      const a = current.get(aId)
      if (fixed.has(aId) || !a) continue
      for (const [bId, target] of targets) {
        const b = current.get(bId)
        if (!b) continue
        moves.set(aId, [...(moves.get(aId) ?? []), Vec.Sub(target, Vec.Sub(a, b))])
      }
    }
    for (const [id, adjustments] of moves) {
      const position = current.get(id)
      if (position) current.set(id, Vec.Average(adjustments).add(position))
    }
  }
  return current
}
