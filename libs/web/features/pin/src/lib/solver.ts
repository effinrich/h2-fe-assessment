import { Vec, type TLShapeId, type VecModel } from "tldraw"

const SOLVER_ITERATIONS = 30

/**
 * A small constraint solver: changed shapes stay put; everything else relaxes
 * toward its target offsets.
 *
 * It is arithmetic over positions and nothing else, so it can be exercised
 * without an editor.
 */
export function relax(
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
