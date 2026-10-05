import type { Editor, TLShape, TLShapeId, Vec, VecLike, VecModel } from "tldraw"

import type { CanAttach, PinLink, PinShape } from "./types"

import { PIN_BINDING, PIN_SHAPE, PIN_TIP } from "./consts"

export function isPin(shape: TLShape | undefined): shape is PinShape {
  return shape?.type === PIN_SHAPE
}

/** Page-space needle tip, through the pin's full page transform. */
export function pinPointOf(editor: Editor, pin: PinShape): Vec {
  return editor.getShapePageTransform(pin).applyToPoint(PIN_TIP)
}

export function pageOrigin(editor: Editor, id: TLShapeId): Vec {
  return editor.getShapePageTransform(id).point()
}

/** Pins are positioned by their pin point, held shapes by their page origin. */
export function positionOf(editor: Editor, id: TLShapeId): VecModel | undefined {
  const shape = editor.getShape(id)
  if (!shape) return undefined
  return isPin(shape) ? pinPointOf(editor, shape) : pageOrigin(editor, id)
}

/** The other end of every pin binding that involves `id`. */
export function neighbours(editor: Editor, id: TLShapeId): TLShapeId[] {
  return editor
    .getBindingsInvolvingShape(id, PIN_BINDING)
    .map((binding) => (binding.fromId === id ? binding.toId : binding.fromId))
}

export function linksOf(editor: Editor, group: readonly TLShapeId[]): PinLink[] {
  return group.flatMap((id) =>
    editor.getBindingsFromShape(id, PIN_BINDING).map((binding) => ({
      pinId: binding.fromId,
      shapeId: binding.toId,
      offset: binding.props.offset
    }))
  )
}

/**
 * Built-in rules first: never a pin, never a container (a frame or group
 * moves its children itself), never locked. `canAttach` can only narrow.
 */
function isEligible(editor: Editor, shape: TLShape, canAttach: CanAttach) {
  if (isPin(shape)) return false
  if (editor.isShapeFrameLike(shape) || editor.isShapeOfType(shape, "group")) return false
  if (editor.isShapeOrAncestorLocked(shape)) return false
  if (!canAttach(shape)) return false
  return editor.canBindShapes({ fromShape: PIN_SHAPE, toShape: shape, binding: PIN_BINDING })
}

/** Every eligible shape under `point`, including unfilled interiors. */
export function eligibleAt(editor: Editor, point: VecLike, canAttach: CanAttach): TLShape[] {
  return editor
    .getShapesAtPoint(point, { hitInside: true })
    .filter((shape) => isEligible(editor, shape, canAttach))
}
