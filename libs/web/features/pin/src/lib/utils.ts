import type { TLShape, TLShapeId, TLThemeColors, VecLike, VecModel } from "tldraw"

import { isEqual, Vec } from "tldraw"

import type {
  AncestorChange,
  AttachmentDiff,
  PinColors,
  PinLink,
  PinState,
  ShapeChange
} from "./types"

import { BADGE_CAP, FREE_LINE_OPACITY, MIN_GLYPH_ZOOM, PIN_EPSILON, PIN_TIP } from "./consts"

/** Whether `a` and `b` differ by more than `epsilon` on either axis. */
export function isFar(a: VecModel, b: VecModel, epsilon = PIN_EPSILON): boolean {
  return Math.abs(a.x - b.x) > epsilon || Math.abs(a.y - b.y) > epsilon
}

/** Page origin that puts an unrotated pin's tip on `point`. */
export function pinOrigin(point: VecLike): Vec {
  return Vec.Sub(point, PIN_TIP)
}

/**
 * How a shape change affects its attachments. Only `translate` drives the
 * group. `reshape` (size or rotation changed, possibly moving the origin)
 * re-baselines the offset instead, so resizing never drags the group.
 * Reparenting with unchanged geometry is a translation: the solver works on
 * page origins, so the new parent is irrelevant.
 */
export function classifyChange(before: TLShape, after: TLShape): ShapeChange {
  if (before.rotation !== after.rotation || !isEqual(before.props, after.props)) {
    return "reshape"
  }
  const moved = before.x !== after.x || before.y !== after.y || before.parentId !== after.parentId
  return moved ? "translate" : "none"
}

/**
 * How a change to a frame or group moves its descendants. Its own size
 * doesn't: resizing a frame from its right or bottom edge moves nothing.
 */
export function ancestorChange(before: TLShape, after: TLShape): AncestorChange {
  if (before.rotation !== after.rotation) return "rotate"
  const moved = before.x !== after.x || before.y !== after.y || before.parentId !== after.parentId
  return moved ? "translate" : "none"
}

/** Every node reachable from `seed` (breadth-first), including `seed`. */
export function connectedGroup(
  seed: TLShapeId,
  neighbours: (id: TLShapeId) => Iterable<TLShapeId>
): Set<TLShapeId> {
  const group = new Set([seed])
  const queue = [seed]
  for (let id = queue.shift(); id !== undefined; id = queue.shift()) {
    for (const next of neighbours(id)) {
      if (group.has(next)) continue
      group.add(next)
      queue.push(next)
    }
  }
  return group
}

export function diffAttachments(
  current: readonly TLShapeId[],
  eligible: readonly TLShapeId[]
): AttachmentDiff {
  const wanted = new Set(eligible)
  const held = new Set(current)
  return {
    create: [...wanted].filter((id) => !held.has(id)),
    remove: current.filter((id) => !wanted.has(id))
  }
}

/**
 * Positions every group member from the driver's position and the stored
 * offsets. `positions` holds pin points for pins and page origins for held
 * shapes. Returns only members that are further than `epsilon` from their
 * target, never the driver. Solving from offsets, not deltas, is what makes a
 * second pass (or a member that already moved with the driver) a no-op.
 */
export function solveGroup(
  driverId: TLShapeId,
  links: readonly PinLink[],
  positions: ReadonlyMap<TLShapeId, VecModel>,
  epsilon = PIN_EPSILON
): Map<TLShapeId, VecModel> {
  const start = positions.get(driverId)
  if (!start) return new Map()

  const solved = new Map<TLShapeId, VecModel>([[driverId, start]])
  const queue = [driverId]
  for (let id = queue.shift(); id !== undefined; id = queue.shift()) {
    const at = solved.get(id)
    if (!at) continue
    for (const { pinId, shapeId, offset } of links) {
      if (shapeId === id && !solved.has(pinId)) {
        solved.set(pinId, { x: at.x - offset.x, y: at.y - offset.y })
        queue.push(pinId)
      } else if (pinId === id && !solved.has(shapeId)) {
        solved.set(shapeId, { x: at.x + offset.x, y: at.y + offset.y })
        queue.push(shapeId)
      }
    }
  }

  const targets = new Map<TLShapeId, VecModel>()
  for (const [id, target] of solved) {
    const current = positions.get(id)
    if (id === driverId || !current) continue
    if (isFar(target, current, epsilon)) targets.set(id, target)
  }
  return targets
}

/**
 * A holding pin is red with a filled head; a free one is a grey outline.
 * Everything comes from the tldraw theme, so dark mode follows the canvas.
 */
export function pinColors(theme: TLThemeColors, state: PinState): PinColors {
  const holding = state === "holding"
  return {
    head: holding ? theme.red.solid : theme.background,
    stroke: holding ? theme.red.solid : theme.text,
    needle: holding ? theme.grey.solid : theme.text,
    lineOpacity: holding ? 1 : FREE_LINE_OPACITY,
    glint: holding ? theme.background : "transparent",
    badgeBg: theme.background,
    badgeFg: theme.text
  }
}

/** Badge text for a pin holding `count` shapes: none below two, capped. */
export function badgeLabel(count: number): string | null {
  if (count < 2) return null
  return count > BADGE_CAP ? `${BADGE_CAP}+` : String(count)
}

/** How much to scale the glyph so it never draws smaller than at `MIN_GLYPH_ZOOM`. */
export function glyphScale(zoom: number): number {
  return Math.max(1, MIN_GLYPH_ZOOM / zoom)
}
