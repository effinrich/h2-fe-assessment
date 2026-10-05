import type { Meta, StoryObj } from "@storybook/react-vite"

import { expect } from "storybook/test"
import { Vec } from "tldraw"

import { PIN_BINDING } from "./consts"
import { createPinExtension } from "./pin-extension"
import { PinStoryCanvas } from "./pin-story-canvas"
import {
  A,
  A_AND_B,
  A_EDGE,
  A_LEFT_HANDLE,
  B,
  B_EDGE,
  C,
  C_BODY,
  C_CENTRE,
  dragFrom,
  EMPTY,
  expectMovedBy,
  expectUnmoved,
  headOf,
  held,
  minus,
  mountedEditor,
  near,
  pinElement,
  placePin,
  plus,
  seed,
  seedFrameAroundA,
  selectionHandleOf,
  snapshot,
  tipOf,
  toggleLock
} from "./story-helpers"

const pinExtension = createPinExtension()

const meta = {
  title: "Features/Pin/Settle",
  render: () => <PinStoryCanvas extension={pinExtension} />
} satisfies Meta

export default meta
type Story = StoryObj<typeof meta>

// When a drag ends, each pin holds exactly what is under it.

export const DragPinToEmptyDetaches: Story = {
  play: async ({ canvasElement, userEvent }) => {
    const editor = await mountedEditor(canvasElement)
    seed(editor)
    const pin = await placePin(userEvent, editor, canvasElement, A_AND_B)
    const head = headOf(editor, pin)

    await dragFrom(userEvent, editor, head, plus(head, minus(EMPTY, A_AND_B)))

    await expect(tipOf(editor, pin)).toEqual(near(EMPTY))
    await expect(held(editor, pin)).toEqual(new Set())
    await expect(pinElement(canvasElement, pin)).toHaveAttribute("data-state", "free")

    const before = snapshot(editor, [A, B])
    await dragFrom(userEvent, editor, A_EDGE, plus(A_EDGE, { x: -40, y: 0 }))
    await expectMovedBy(editor, before, [A], { x: -40, y: 0 })
    await expectUnmoved(editor, before, [B])
  }
}

export const DragPinOntoOverlapAttaches: Story = {
  play: async ({ canvasElement, userEvent }) => {
    const editor = await mountedEditor(canvasElement)
    seed(editor)
    const pin = await placePin(userEvent, editor, canvasElement, EMPTY)
    await expect(held(editor, pin)).toEqual(new Set())
    const head = headOf(editor, pin)

    await dragFrom(userEvent, editor, head, plus(head, minus(A_AND_B, EMPTY)))

    await expect(held(editor, pin)).toEqual(new Set([A, B]))
    await expect(pinElement(canvasElement, pin)).toHaveAttribute("data-state", "holding")
  }
}

export const CarryOntoShapePicksUp: Story = {
  play: async ({ canvasElement, userEvent }) => {
    const editor = await mountedEditor(canvasElement)
    seed(editor)
    const pin = await placePin(userEvent, editor, canvasElement, C_CENTRE)

    // C (and the pin with it) lands so the pin point is inside A only.
    await dragFrom(userEvent, editor, C_BODY, plus(C_BODY, { x: -380, y: 0 }))

    await expect(tipOf(editor, pin)).toEqual(near({ x: 100, y: 60 }))
    await expect(held(editor, pin)).toEqual(new Set([A, C]))
  }
}

/** A guard rather than a red-first scenario: nothing attaches shapes except a pin. */
export const OverlapWithoutPinDoesNotAttach: Story = {
  play: async ({ canvasElement, userEvent }) => {
    const editor = await mountedEditor(canvasElement)
    seed(editor)

    await dragFrom(userEvent, editor, C_BODY, plus(C_BODY, { x: -380, y: 0 }))
    const boundsA = editor.getShapePageBounds(A)
    const boundsC = editor.getShapePageBounds(C)
    await expect(boundsA && boundsC && boundsA.collides(boundsC)).toBe(true)
    await expect(editor.getBindingsInvolvingShape(C, PIN_BINDING)).toHaveLength(0)

    const before = snapshot(editor, [A, C])
    await dragFrom(userEvent, editor, A_EDGE, plus(A_EDGE, { x: -40, y: 0 }))
    await expectMovedBy(editor, before, [A], { x: -40, y: 0 })
    await expectUnmoved(editor, before, [C])
  }
}

export const UndoDetachIsOneStep: Story = {
  play: async ({ canvasElement, userEvent }) => {
    const editor = await mountedEditor(canvasElement)
    seed(editor)
    const pin = await placePin(userEvent, editor, canvasElement, A_AND_B)
    const head = headOf(editor, pin)
    await dragFrom(userEvent, editor, head, plus(head, minus(EMPTY, A_AND_B)))
    await expect(held(editor, pin)).toEqual(new Set())

    editor.undo()

    await expect(tipOf(editor, pin)).toEqual(A_AND_B)
    await expect(held(editor, pin)).toEqual(new Set([A, B]))
  }
}

export const LockingHeldShapeDetaches: Story = {
  play: async ({ canvasElement, userEvent }) => {
    const editor = await mountedEditor(canvasElement)
    seed(editor)
    const pin = await placePin(userEvent, editor, canvasElement, A_AND_B)

    editor.select(B)
    await toggleLock(userEvent)
    await expect(editor.getShape(B)?.isLocked).toBe(true)
    await expect(held(editor, pin)).toEqual(new Set([A]))

    // The detach is part of the lock's undo step.
    editor.undo()
    await expect(editor.getShape(B)?.isLocked).toBe(false)
    await expect(held(editor, pin)).toEqual(new Set([A, B]))
    editor.redo()
    await expect(editor.getShape(B)?.isLocked).toBe(true)
    await expect(held(editor, pin)).toEqual(new Set([A]))

    const before = snapshot(editor, [A, B])
    await dragFrom(userEvent, editor, A_EDGE, plus(A_EDGE, { x: -40, y: 0 }))
    await expectMovedBy(editor, before, [A], { x: -40, y: 0 })
    await expectUnmoved(editor, before, [B])
  }
}

export const LockingFrameDetachesHeldChild: Story = {
  play: async ({ canvasElement, userEvent }) => {
    const editor = await mountedEditor(canvasElement)
    seed(editor)
    const frame = seedFrameAroundA(editor)
    const pin = await placePin(userEvent, editor, canvasElement, A_AND_B)
    await expect(held(editor, pin)).toEqual(new Set([A, B]))

    editor.select(frame)
    await toggleLock(userEvent)

    await expect(editor.getShape(frame)?.isLocked).toBe(true)
    await expect(held(editor, pin)).toEqual(new Set([B]))
  }
}

/** Inside A only, near its top-left corner. */
const A_CORNER = { x: 10, y: 10 }

export const RotateOffPinDetaches: Story = {
  play: async ({ canvasElement, userEvent }) => {
    const editor = await mountedEditor(canvasElement)
    seed(editor)
    const pin = await placePin(userEvent, editor, canvasElement, A_CORNER)
    await expect(held(editor, pin)).toEqual(new Set([A]))
    editor.select(A)
    const centre = editor.getShapePageBounds(A)?.center
    if (!centre) throw new Error("no bounds for A")
    const handle = selectionHandleOf(editor, "top_right_rotate")

    await dragFrom(userEvent, editor, handle, Vec.RotWith(handle, centre, -Math.PI / 6))

    // Rotations are stored in [0, 2π).
    await expect(editor.getShape(A)?.rotation).toBeCloseTo(2 * Math.PI - Math.PI / 6, 1)
    await expect(held(editor, pin)).toEqual(new Set())

    editor.undo()
    await expect(editor.getShape(A)?.rotation).toBe(0)
    await expect(held(editor, pin)).toEqual(new Set([A]))
  }
}

export const ResizeOffPinDetaches: Story = {
  play: async ({ canvasElement, userEvent }) => {
    const editor = await mountedEditor(canvasElement)
    seed(editor)
    const pin = await placePin(userEvent, editor, canvasElement, A_CORNER)
    await expect(held(editor, pin)).toEqual(new Set([A]))
    editor.select(A)
    const before = snapshot(editor, [A])

    await dragFrom(userEvent, editor, A_LEFT_HANDLE, plus(A_LEFT_HANDLE, { x: 40, y: 0 }))

    await expectMovedBy(editor, before, [A], { x: 40, y: 0 })
    await expect(held(editor, pin)).toEqual(new Set())

    editor.undo()
    await expectUnmoved(editor, before, [A])
    await expect(held(editor, pin)).toEqual(new Set([A]))
  }
}

export const UnrelatedDragLeavesDistantPin: Story = {
  play: async ({ canvasElement, userEvent }) => {
    const editor = await mountedEditor(canvasElement)
    seed(editor)
    const pin = await placePin(userEvent, editor, canvasElement, A_AND_B)
    editor.select(B)
    await toggleLock(userEvent)
    editor.select(B)
    await toggleLock(userEvent)
    await expect(editor.getShape(B)?.isLocked).toBe(false)
    await expect(held(editor, pin)).toEqual(new Set([A]))
    editor.selectNone()

    await dragFrom(userEvent, editor, C_BODY, plus(C_BODY, { x: 0, y: 150 }))
    await expect(held(editor, pin)).toEqual(new Set([A]))

    // Control: a drag of B, under the pin's point, does settle it.
    editor.selectNone()
    await dragFrom(userEvent, editor, B_EDGE, plus(B_EDGE, { x: 5, y: 0 }))
    await expect(held(editor, pin)).toEqual(new Set([A, B]))
  }
}

export const DrawingAShapeDoesNotAttach: Story = {
  play: async ({ canvasElement, userEvent }) => {
    const editor = await mountedEditor(canvasElement)
    seed(editor)
    const pin = await placePin(userEvent, editor, canvasElement, EMPTY)
    const before = new Set(editor.getCurrentPageShapeIds())

    await userEvent.keyboard("r")
    await dragFrom(userEvent, editor, minus(EMPTY, { x: 30, y: 30 }), plus(EMPTY, { x: 30, y: 30 }))

    const drawn = [...editor.getCurrentPageShapeIds()].filter((id) => !before.has(id))
    await expect(drawn).toHaveLength(1)
    await expect(held(editor, pin)).toEqual(new Set())

    // Moving the new shape is a move: now it attaches.
    editor.selectNone()
    const edge = minus(EMPTY, { x: 30, y: 0 })
    await dragFrom(userEvent, editor, edge, plus(edge, { x: 10, y: 0 }))
    await expect(held(editor, pin)).toEqual(new Set(drawn))
  }
}

export const NudgeResettles: Story = {
  play: async ({ canvasElement, userEvent }) => {
    const editor = await mountedEditor(canvasElement)
    seed(editor)
    // 4 units inside A's right edge, and inside B.
    const pin = await placePin(userEvent, editor, canvasElement, { x: 196, y: 90 })
    await expect(held(editor, pin)).toEqual(new Set([A, B]))
    editor.select(pin)

    await userEvent.keyboard("{Shift>}{ArrowRight}{/Shift}")

    await expect(tipOf(editor, pin)).toEqual({ x: 206, y: 90 })
    await expect(held(editor, pin)).toEqual(new Set([B]))
  }
}
