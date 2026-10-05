import { Vec, type Editor, type TLShapeId, type TLShapePartial, type VecModel } from "tldraw"

import type { PinBinding } from "./types"

import { PIN_BINDING } from "./consts"
import { isPin, linksOf, neighbours, pageOrigin, pinPointOf, positionOf } from "./pin-queries"
import { ancestorChange, connectedGroup, isFar, solveGroup } from "./utils"

function moveTo(editor: Editor, id: TLShapeId, target: VecModel): TLShapePartial | undefined {
  const shape = editor.getShape(id)
  if (!shape) return undefined
  const pageTarget = isPin(shape)
    ? Vec.Add(pageOrigin(editor, id), Vec.Sub(target, pinPointOf(editor, shape)))
    : target
  const { x, y } = editor.getPointInParentSpace(shape, pageTarget)
  return { id, type: shape.type, x, y }
}

/**
 * The first driver of each connected group positions the rest of it from
 * the stored offsets. Idempotent: a group that is already consistent (our
 * own writes echoing back, a member that moved with the driver, an undo
 * replay) produces no writes. `reshaped` shapes are never moved. Writes
 * ignore locks, so a locked pin still follows.
 */
export function follow(
  editor: Editor,
  drivers: Iterable<TLShapeId>,
  reshaped: ReadonlySet<TLShapeId> = new Set()
) {
  const solved = new Set<TLShapeId>()
  const partials: TLShapePartial[] = []

  for (const driver of drivers) {
    if (solved.has(driver) || !editor.getShape(driver)) continue
    const group = [...connectedGroup(driver, (id) => neighbours(editor, id))]
    for (const id of group) solved.add(id)

    const positions = new Map<TLShapeId, VecModel>()
    for (const id of group) {
      const position = positionOf(editor, id)
      if (position) positions.set(id, position)
    }
    for (const [id, target] of solveGroup(driver, linksOf(editor, group), positions)) {
      if (reshaped.has(id)) continue
      const partial = moveTo(editor, id, target)
      if (partial) partials.push(partial)
    }
  }

  if (partials.length > 0) {
    editor.run(() => editor.updateShapes(partials), { ignoreShapeLock: true })
  }
}

/** Stores each binding's current offset where it has drifted. */
export function rebaselineBindings(editor: Editor, bindings: readonly PinBinding[]) {
  const updates = bindings.flatMap((binding) => {
    const pin = editor.getShape(binding.fromId)
    if (!isPin(pin) || !editor.getShape(binding.toId)) return []
    const offset = Vec.Sub(pageOrigin(editor, binding.toId), pinPointOf(editor, pin)).toJson()
    if (!isFar(offset, binding.props.offset)) return []
    return [{ id: binding.id, type: binding.type, props: { offset } }]
  })
  if (updates.length > 0) editor.updateBindings(updates)
}

/**
 * A resized or rotated shape (or pin) stays attached where it now is, and
 * moves nothing: every binding involving it is re-baselined.
 */
export function rebaseline(editor: Editor, shapeIds: Iterable<TLShapeId>) {
  const bindings = new Map<string, PinBinding>()
  for (const id of shapeIds) {
    for (const binding of editor.getBindingsInvolvingShape(id, PIN_BINDING)) {
      bindings.set(binding.id, binding)
    }
  }
  rebaselineBindings(editor, [...bindings.values()])
}

/** Pins left holding nothing because their shapes were deleted go too. */
export function deleteOrphans(editor: Editor, pinIds: Iterable<TLShapeId>) {
  const orphans = [...pinIds].filter(
    (id) => editor.getShape(id) && editor.getBindingsFromShape(id, PIN_BINDING).length === 0
  )
  if (orphans.length > 0) {
    editor.run(() => editor.deleteShapes(orphans), { ignoreShapeLock: true })
  }
}

/**
 * tldraw reports `ancestry` to bindings only when a shape is reparented, not
 * when its frame or group moves. A translated shape's held descendants drive
 * their groups; a rotated shape's held descendants and pins turned with it,
 * so their bindings are re-baselined and they drive nothing. Returns the
 * unsubscribe.
 */
export function listenForAncestorMoves(editor: Editor): () => void {
  const drivers = new Set<TLShapeId>()
  const turned = new Set<TLShapeId>()
  const stopChange = editor.sideEffects.registerAfterChangeHandler("shape", (before, after) => {
    const change = ancestorChange(before, after)
    if (change === "none") return
    editor.visitDescendants(after.id, (id) => {
      if (change === "rotate") {
        if (editor.getBindingsInvolvingShape(id, PIN_BINDING).length > 0) turned.add(id)
      } else if (editor.getBindingsToShape(id, PIN_BINDING).length > 0) {
        drivers.add(id)
      }
    })
  })
  const stopComplete = editor.sideEffects.registerOperationCompleteHandler(() => {
    if (drivers.size === 0 && turned.size === 0) return
    const driverIds = [...drivers]
    const turnedIds = new Set(turned)
    drivers.clear()
    turned.clear()
    rebaseline(editor, turnedIds)
    follow(editor, driverIds, turnedIds)
  })
  return () => {
    stopChange()
    stopComplete()
  }
}
