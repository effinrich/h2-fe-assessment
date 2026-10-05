import type { Meta, StoryObj } from "@storybook/react-vite"
import type { Editor, TLShape, TLShapeId } from "tldraw"

import { expect } from "storybook/test"
import { createShapeId } from "tldraw"

import { PIN_BINDING, PIN_SHAPE } from "./consts"
import { createPinExtension } from "./pin-extension"
import { PinStoryCanvas } from "./pin-story-canvas"
import {
  A,
  A_AND_B,
  A_EDGE,
  A_LEFT_HANDLE,
  B,
  B_AND_MOVED_C,
  B_EDGE,
  C,
  C_BODY,
  C_CENTRE,
  dragFrom,
  duplicateSelection,
  expectMovedBy,
  expectUnmoved,
  frameHeadingOf,
  held,
  IN_A_AND_B_BOUNDS,
  mountedEditor,
  placePin,
  plus,
  positionOf,
  seed,
  seedFrameAroundA,
  snapshot,
  toggleLock,
  type StoryUser
} from "./story-helpers"

const pinExtension = createPinExtension()

const meta = {
  title: "Features/Pin/Follow",
  render: () => <PinStoryCanvas extension={pinExtension} />
} satisfies Meta

export default meta
type Story = StoryObj<typeof meta>

// A pure translation of a held shape moves its whole group.

const DRAG = { x: 100, y: 50 }

export const DragOneMovesAll: Story = {
  play: async ({ canvasElement, userEvent }) => {
    const editor = await mountedEditor(canvasElement)
    seed(editor)
    const pin = await placePin(userEvent, editor, canvasElement, A_AND_B)
    const before = snapshot(editor, [A, B, C, pin])

    await dragFrom(userEvent, editor, A_EDGE, plus(A_EDGE, DRAG))

    await expectMovedBy(editor, before, [A, B, pin], DRAG)
    await expectUnmoved(editor, before, [C])
    await expect(held(editor, pin)).toEqual(new Set([A, B]))
  }
}

export const DragEitherMember: Story = {
  play: async ({ canvasElement, userEvent }) => {
    const editor = await mountedEditor(canvasElement)
    seed(editor)
    const pin = await placePin(userEvent, editor, canvasElement, A_AND_B)
    const before = snapshot(editor, [A, B, pin])

    await dragFrom(userEvent, editor, B_EDGE, plus(B_EDGE, DRAG))

    await expectMovedBy(editor, before, [A, B, pin], DRAG)
  }
}

export const SingleShapeFollow: Story = {
  play: async ({ canvasElement, userEvent }) => {
    const editor = await mountedEditor(canvasElement)
    seed(editor)
    const pin = await placePin(userEvent, editor, canvasElement, C_CENTRE)
    await expect(held(editor, pin)).toEqual(new Set([C]))
    const before = snapshot(editor, [C, pin])

    await dragFrom(userEvent, editor, C_BODY, plus(C_BODY, { x: 0, y: 150 }))

    await expectMovedBy(editor, before, [C, pin], { x: 0, y: 150 })
  }
}

/** P1 at A∩B and P2 at B∩C, with C moved to overlap B: one group of five. */
async function transitiveGroup(
  user: StoryUser,
  editor: Editor,
  canvasElement: HTMLElement
): Promise<[TLShapeId, TLShapeId]> {
  seed(editor)
  editor.run(() => editor.updateShape({ id: C, type: "geo", x: 280, y: 100 }), {
    history: "ignore"
  })
  const p1 = await placePin(user, editor, canvasElement, A_AND_B)
  const p2 = await placePin(user, editor, canvasElement, B_AND_MOVED_C)
  await expect(held(editor, p2)).toEqual(new Set([B, C]))
  return [p1, p2]
}

export const TransitiveGroup: Story = {
  play: async ({ canvasElement, userEvent }) => {
    const editor = await mountedEditor(canvasElement)
    const [p1, p2] = await transitiveGroup(userEvent, editor, canvasElement)
    const before = snapshot(editor, [A, B, C, p1, p2])

    await dragFrom(userEvent, editor, A_EDGE, plus(A_EDGE, DRAG))

    await expectMovedBy(editor, before, [A, B, C, p1, p2], DRAG)
  }
}

export const NoUpdateLoop: Story = {
  play: async ({ canvasElement, userEvent }) => {
    const editor = await mountedEditor(canvasElement)
    const [p1, p2] = await transitiveGroup(userEvent, editor, canvasElement)
    const before = snapshot(editor, [A, B, C, p1, p2])
    const updates = new Map<TLShapeId, number>()
    const stop = editor.sideEffects.registerAfterChangeHandler("shape", (_, next) => {
      updates.set(next.id, (updates.get(next.id) ?? 0) + 1)
    })

    editor.updateShape({ id: A, type: "geo", x: 10 })
    stop()

    await expect(Object.fromEntries(updates)).toEqual({ [A]: 1, [B]: 1, [C]: 1, [p1]: 1, [p2]: 1 })
    await expectMovedBy(editor, before, [A, B, C, p1, p2], { x: 10, y: 0 })
  }
}

export const MultiSelectDragNoDoubleMove: Story = {
  play: async ({ canvasElement, userEvent }) => {
    const editor = await mountedEditor(canvasElement)
    seed(editor)
    const pin = await placePin(userEvent, editor, canvasElement, A_AND_B)
    editor.select(A, B)
    const before = snapshot(editor, [A, B, pin])

    await dragFrom(userEvent, editor, IN_A_AND_B_BOUNDS, plus(IN_A_AND_B_BOUNDS, { x: 40, y: 0 }))

    await expectMovedBy(editor, before, [A, B, pin], { x: 40, y: 0 })
  }
}

export const ResizeDoesNotDragGroup: Story = {
  play: async ({ canvasElement, userEvent }) => {
    const editor = await mountedEditor(canvasElement)
    seed(editor)
    const pin = await placePin(userEvent, editor, canvasElement, A_AND_B)
    editor.select(A)
    const before = snapshot(editor, [A, B, pin])

    await dragFrom(userEvent, editor, A_LEFT_HANDLE, plus(A_LEFT_HANDLE, { x: 40, y: 0 }))

    await expectMovedBy(editor, before, [A], { x: 40, y: 0 })
    await expectUnmoved(editor, before, [B, pin])
    await expect(held(editor, pin)).toEqual(new Set([A, B]))

    // A still leads the group with its new offset.
    editor.selectNone()
    const resized = snapshot(editor, [A, B, pin])
    await dragFrom(userEvent, editor, { x: 40, y: 30 }, { x: 40, y: 60 })
    await expectMovedBy(editor, resized, [A, B, pin], { x: 0, y: 30 })
  }
}

export const FollowsThroughFrame: Story = {
  play: async ({ canvasElement, userEvent }) => {
    const editor = await mountedEditor(canvasElement)
    seed(editor)
    const F = seedFrameAroundA(editor)
    await expect(editor.getShape(A)?.parentId).toBe(F)
    const pin = await placePin(userEvent, editor, canvasElement, A_AND_B)
    await expect(held(editor, pin)).toEqual(new Set([A, B]))
    const before = snapshot(editor, [F, A, B, pin])

    const heading = frameHeadingOf(editor, F)
    await dragFrom(userEvent, editor, heading, plus(heading, DRAG))

    await expectMovedBy(editor, before, [F, A, B, pin], DRAG)
  }
}

export const FollowsThroughGroup: Story = {
  play: async ({ canvasElement, userEvent }) => {
    const editor = await mountedEditor(canvasElement)
    seed(editor)
    const group = createShapeId("group")
    editor.run(() => editor.groupShapes([A, C], { groupId: group, select: false }), {
      history: "ignore"
    })
    await expect(editor.getShape(A)?.parentId).toBe(group)
    const pin = await placePin(userEvent, editor, canvasElement, A_AND_B)
    await expect(held(editor, pin)).toEqual(new Set([A, B]))
    editor.selectNone()
    const before = snapshot(editor, [A, B, C, pin])

    await dragFrom(userEvent, editor, C_BODY, plus(C_BODY, DRAG))

    await expectMovedBy(editor, before, [A, B, C, pin], DRAG)
  }
}

export const RotateFrameThenDragDoesNotJump: Story = {
  play: async ({ canvasElement, userEvent }) => {
    const editor = await mountedEditor(canvasElement)
    seed(editor)
    const frame = seedFrameAroundA(editor)
    const pin = await placePin(userEvent, editor, canvasElement, A_AND_B)
    await expect(held(editor, pin)).toEqual(new Set([A, B]))

    editor.select(frame)
    await userEvent.keyboard("{Shift>}.{/Shift}")
    await expect(editor.getShape(frame)?.rotation).not.toBe(0)
    editor.selectNone()

    const before = snapshot(editor, [A, B, pin])
    const grab = editor.getShapePageTransform(A).applyToPoint(A_EDGE)
    await dragFrom(userEvent, editor, grab, plus(grab, DRAG))

    await expectMovedBy(editor, before, [A, B, pin], DRAG)
  }
}

export const LockedPinStillFollows: Story = {
  play: async ({ canvasElement, userEvent }) => {
    const editor = await mountedEditor(canvasElement)
    seed(editor)
    const pin = await placePin(userEvent, editor, canvasElement, A_AND_B)
    await toggleLock(userEvent)
    await expect(editor.getShape(pin)?.isLocked).toBe(true)
    const before = snapshot(editor, [A, B, pin])

    await dragFrom(userEvent, editor, A_EDGE, plus(A_EDGE, DRAG))

    await expectMovedBy(editor, before, [A, B, pin], DRAG)
    await expect(editor.getShape(pin)?.isLocked).toBe(true)
    await expect(held(editor, pin)).toEqual(new Set([A, B]))
  }
}

export const UndoDragIsOneStep: Story = {
  play: async ({ canvasElement, userEvent }) => {
    const editor = await mountedEditor(canvasElement)
    seed(editor)
    const pin = await placePin(userEvent, editor, canvasElement, A_AND_B)
    const before = snapshot(editor, [A, B, pin])
    await dragFrom(userEvent, editor, A_EDGE, plus(A_EDGE, DRAG))
    await expectMovedBy(editor, before, [A, B, pin], DRAG)

    editor.undo()
    await expectUnmoved(editor, before, [A, B, pin])

    editor.redo()
    await expectMovedBy(editor, before, [A, B, pin], DRAG)
  }
}

export const DuplicateGroup: Story = {
  play: async ({ canvasElement, userEvent }) => {
    const editor = await mountedEditor(canvasElement)
    seed(editor)
    const pin = await placePin(userEvent, editor, canvasElement, A_AND_B)
    const originals = new Set<TLShapeId>([A, B, C, pin])
    editor.select(pin, A, B)

    await duplicateSelection(userEvent, editor)

    const copies = editor.getCurrentPageShapes().filter((shape) => !originals.has(shape.id))
    await expect(copies).toHaveLength(3)
    // A and B differ in width; the pin is the only pin.
    const copyWhere = (match: (shape: TLShape) => boolean) => {
      const copy = copies.find(match)
      if (!copy) throw new Error("missing copy")
      return copy.id
    }
    const widthOf = (shape: TLShape) => editor.getShapeGeometry(shape).bounds.w
    const copyA = copyWhere((shape) => shape.type === "geo" && widthOf(shape) === 200)
    const copyB = copyWhere((shape) => shape.type === "geo" && widthOf(shape) === 160)
    const copyPin = copyWhere((shape) => shape.type === PIN_SHAPE)
    await expect(held(editor, copyPin)).toEqual(new Set([copyA, copyB]))

    editor.selectNone()
    const before = snapshot(editor, [A, B, pin, copyA, copyB, copyPin])
    const grab = plus(positionOf(editor, copyA), { x: 0, y: 30 })
    await dragFrom(userEvent, editor, grab, plus(grab, { x: 0, y: 200 }))

    await expectMovedBy(editor, before, [copyA, copyB, copyPin], { x: 0, y: 200 })
    await expectUnmoved(editor, before, [A, B, pin])
  }
}

export const DuplicateOneHeldShape: Story = {
  play: async ({ canvasElement, userEvent }) => {
    const editor = await mountedEditor(canvasElement)
    seed(editor)
    const pin = await placePin(userEvent, editor, canvasElement, A_AND_B)
    const originals = new Set<TLShapeId>([A, B, C, pin])
    editor.select(A)

    await duplicateSelection(userEvent, editor)

    const copies = editor.getCurrentPageShapes().filter((shape) => !originals.has(shape.id))
    await expect(copies.map((shape) => shape.type)).toEqual(["geo"])
    const [copy] = copies
    if (!copy) throw new Error("no copy")
    await expect(editor.getBindingsInvolvingShape(copy, PIN_BINDING)).toEqual([])
    await expect(held(editor, pin)).toEqual(new Set([A, B]))

    editor.selectNone()
    const before = snapshot(editor, [A, B, pin, copy.id])
    const grab = plus(positionOf(editor, copy.id), { x: 0, y: 30 })
    await dragFrom(userEvent, editor, grab, plus(grab, { x: 0, y: 200 }))

    await expectMovedBy(editor, before, [copy.id], { x: 0, y: 200 })
    await expectUnmoved(editor, before, [A, B, pin])
  }
}
