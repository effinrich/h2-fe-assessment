import type { Meta, StoryObj } from "@storybook/react-vite"

import { expect } from "storybook/test"

import { createPinExtension } from "./pin-extension"
import { PinStoryCanvas } from "./pin-story-canvas"
import {
  A,
  A_AND_B,
  A_EDGE,
  allPinBindings,
  B,
  dragFrom,
  expectMovedBy,
  expectUnmoved,
  held,
  mountedEditor,
  placePin,
  plus,
  seed,
  snapshot,
  toggleLock
} from "./story-helpers"

const pinExtension = createPinExtension()

const meta = {
  title: "Features/Pin/Delete",
  render: () => <PinStoryCanvas extension={pinExtension} />
} satisfies Meta

export default meta
type Story = StoryObj<typeof meta>

export const DeleteCascade: Story = {
  play: async ({ canvasElement, userEvent }) => {
    const editor = await mountedEditor(canvasElement)
    seed(editor)
    const pin = await placePin(userEvent, editor, canvasElement, A_AND_B)

    editor.select(A)
    await userEvent.keyboard("{Delete}")
    await expect(editor.getShape(pin)).toBeDefined()
    await expect(held(editor, pin)).toEqual(new Set([B]))

    editor.select(B)
    await userEvent.keyboard("{Delete}")
    await expect(editor.getShape(B)).toBeUndefined()
    await expect(editor.getShape(pin)).toBeUndefined()

    editor.undo()
    await expect(editor.getShape(B)).toBeDefined()
    await expect(held(editor, pin)).toEqual(new Set([B]))

    editor.redo()
    await expect(editor.getShape(pin)).toBeUndefined()
  }
}

export const DeleteAllHeldAtOnce: Story = {
  play: async ({ canvasElement, userEvent }) => {
    const editor = await mountedEditor(canvasElement)
    seed(editor)
    const pin = await placePin(userEvent, editor, canvasElement, A_AND_B)

    editor.select(A, B)
    await userEvent.keyboard("{Delete}")
    await expect(editor.getShape(A)).toBeUndefined()
    await expect(editor.getShape(B)).toBeUndefined()
    await expect(editor.getShape(pin)).toBeUndefined()

    editor.undo()
    await expect(editor.getShape(A)).toBeDefined()
    await expect(editor.getShape(B)).toBeDefined()
    await expect(held(editor, pin)).toEqual(new Set([A, B]))
  }
}

export const DeletePinFreesShapes: Story = {
  play: async ({ canvasElement, userEvent }) => {
    const editor = await mountedEditor(canvasElement)
    seed(editor)
    const pin = await placePin(userEvent, editor, canvasElement, A_AND_B)

    editor.select(pin)
    await userEvent.keyboard("{Delete}")
    await expect(editor.getShape(pin)).toBeUndefined()
    await expect(editor.getShape(A)).toBeDefined()
    await expect(editor.getShape(B)).toBeDefined()
    await expect(allPinBindings(editor)).toEqual([])

    editor.selectNone()
    const before = snapshot(editor, [A, B])
    await dragFrom(userEvent, editor, A_EDGE, plus(A_EDGE, { x: -40, y: 0 }))
    await expectMovedBy(editor, before, [A], { x: -40, y: 0 })
    await expectUnmoved(editor, before, [B])
  }
}

export const LockedOrphanPinIsDeleted: Story = {
  play: async ({ canvasElement, userEvent }) => {
    const editor = await mountedEditor(canvasElement)
    seed(editor)
    const pin = await placePin(userEvent, editor, canvasElement, A_AND_B)
    await toggleLock(userEvent)
    await expect(editor.getShape(pin)?.isLocked).toBe(true)

    editor.select(A, B)
    await userEvent.keyboard("{Delete}")
    await expect(editor.getShape(A)).toBeUndefined()
    await expect(editor.getShape(B)).toBeUndefined()
    await expect(editor.getShape(pin)).toBeUndefined()

    editor.undo()
    await expect(editor.getShape(pin)?.isLocked).toBe(true)
    await expect(held(editor, pin)).toEqual(new Set([A, B]))
  }
}
