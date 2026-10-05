import { Vec, type Box, type Editor, type TLEventInfo, type TLShapeId } from "tldraw"

import type { CanAttach } from "./types"

import { ARROW_KEYS, PIN_BINDING, REST_INTERACTIONS } from "./consts"
import { rebaselineBindings } from "./pin-follow"
import { eligibleAt, isPin, neighbours, pageOrigin, pinPointOf } from "./pin-queries"
import { classifyChange, connectedGroup, diffAttachments } from "./utils"

export type Settle = (editor: Editor, pinIds: readonly TLShapeId[]) => void

/**
 * Makes each pin hold exactly the eligible shapes under its point: creates
 * and deletes bindings to match and re-baselines kept offsets. Writes nothing
 * when nothing changed. A locked pin settles too. Returns, per pin, the
 * shapes it newly attached.
 */
export function settlePins(
  editor: Editor,
  pinIds: readonly TLShapeId[],
  canAttach: CanAttach
): Map<TLShapeId, TLShapeId[]> {
  const attached = new Map<TLShapeId, TLShapeId[]>()
  editor.run(() => settleEach(editor, pinIds, canAttach, attached), { ignoreShapeLock: true })
  return attached
}

function settleEach(
  editor: Editor,
  pinIds: readonly TLShapeId[],
  canAttach: CanAttach,
  attached: Map<TLShapeId, TLShapeId[]>
) {
  for (const pinId of pinIds) {
    const pin = editor.getShape(pinId)
    if (!isPin(pin)) continue

    const point = pinPointOf(editor, pin)
    const bindings = editor.getBindingsFromShape(pin, PIN_BINDING)
    const { create, remove } = diffAttachments(
      bindings.map((binding) => binding.toId),
      eligibleAt(editor, point, canAttach).map((shape) => shape.id)
    )

    const removed = bindings.filter((binding) => remove.includes(binding.toId))
    if (removed.length > 0) editor.deleteBindings(removed)
    rebaselineBindings(
      editor,
      bindings.filter((binding) => !remove.includes(binding.toId))
    )

    if (create.length > 0) {
      editor.createBindings(
        create.map((toId) => ({
          type: PIN_BINDING,
          fromId: pin.id,
          toId,
          props: { offset: Vec.Sub(pageOrigin(editor, toId), point).toJson() }
        }))
      )
      editor.bringToFront([pin.id])
      attached.set(pin.id, create)
    }
  }
}

function interactionOf(editor: Editor): string | undefined {
  return REST_INTERACTIONS.find((path) => editor.isIn(path))
}

/**
 * The pins a move can have affected: pins that moved, pins in a moved
 * shape's connected group, and pins whose point lies in a moved shape's
 * page bounds from before (`moved`) or after (now) the move.
 */
function affectedPins(editor: Editor, moved: ReadonlyMap<TLShapeId, Box | undefined>): TLShapeId[] {
  const affected = new Set<TLShapeId>()
  const areas: Box[] = []
  for (const [id, before] of moved) {
    if (before) areas.push(before)
    if (!editor.getShape(id)) continue
    const after = editor.getShapePageBounds(id)
    if (after) areas.push(after)
    for (const member of connectedGroup(id, (next) => neighbours(editor, next))) {
      if (isPin(editor.getShape(member))) affected.add(member)
    }
  }
  for (const shape of editor.getCurrentPageShapes()) {
    if (!isPin(shape) || affected.has(shape.id)) continue
    const point = pinPointOf(editor, shape)
    if (areas.some((area) => area.containsPoint(point))) affected.add(shape.id)
  }
  return [...affected]
}

/**
 * When a translate, resize or rotate ends (any exit from those states:
 * drop, tool hand-off or cancel) and after an arrow-key nudge, settles the
 * pins the moves since the last rest can have affected. Runs after tldraw
 * has handled the event, inside the same undo step as the move. Shapes
 * created during a resize were drawn, not moved. Returns the unsubscribe.
 */
export function listenForRest(editor: Editor, settle: Settle): () => void {
  const moved = new Map<TLShapeId, Box | undefined>()
  const created = new Set<TLShapeId>()

  const stopBefore = editor.sideEffects.registerBeforeChangeHandler("shape", (prev, next) => {
    if (!moved.has(prev.id) && classifyChange(prev, next) !== "none") {
      moved.set(prev.id, editor.getShapePageBounds(prev.id)?.clone())
    }
    return next
  })
  const stopCreate = editor.sideEffects.registerAfterCreateHandler("shape", (shape) => {
    created.add(shape.id)
  })

  let wasIn = interactionOf(editor)
  const onBeforeEvent = () => {
    if (!interactionOf(editor)) created.clear()
  }
  const onEvent = (info: TLEventInfo) => {
    const now = interactionOf(editor)
    const ended = now === undefined ? wasIn : undefined
    wasIn = now
    const nudged =
      info.type === "keyboard" &&
      info.name === "key_up" &&
      ARROW_KEYS.has(info.code) &&
      editor.isIn("select.idle")
    if (!ended && !nudged) return

    if (ended === "select.resizing") for (const id of created) moved.delete(id)
    const pinIds = affectedPins(editor, moved)
    moved.clear()
    created.clear()
    if (pinIds.length > 0) editor.run(() => settle(editor, pinIds))
  }

  editor.on("before-event", onBeforeEvent)
  editor.on("event", onEvent)
  return () => {
    stopBefore()
    stopCreate()
    editor.off("before-event", onBeforeEvent)
    editor.off("event", onEvent)
  }
}

/**
 * A held shape that becomes locked, itself or through a frame or group, is
 * let go: its pins settle once the lock's operation completes, inside the
 * lock's undo step. Returns the unsubscribe.
 */
export function listenForLocks(editor: Editor, settle: Settle): () => void {
  const pinIds = new Set<TLShapeId>()
  const collect = (id: TLShapeId) => {
    for (const binding of editor.getBindingsToShape(id, PIN_BINDING)) pinIds.add(binding.fromId)
  }
  const stopChange = editor.sideEffects.registerAfterChangeHandler("shape", (before, after) => {
    if (before.isLocked || !after.isLocked) return
    collect(after.id)
    editor.visitDescendants(after.id, collect)
  })
  const stopComplete = editor.sideEffects.registerOperationCompleteHandler(() => {
    if (pinIds.size === 0) return
    const ids = [...pinIds]
    pinIds.clear()
    settle(editor, ids)
  })
  return () => {
    stopChange()
    stopComplete()
  }
}
