import type { Meta, StoryObj } from "@storybook/react-vite"

import { expect, screen, waitFor, within } from "storybook/test"
import { Vec } from "tldraw"

import { FIRST_USE_HINT, FIRST_USE_HINT_STORAGE_KEY, PIN_BINDING, PIN_TOOL_ID } from "./consts"
import { createPinExtension } from "./pin-extension"
import { PinStoryCanvas } from "./pin-story-canvas"
import {
  A,
  A_AND_B,
  allPinBindings,
  B,
  C,
  clickAt,
  dragFrom,
  EMPTY,
  held,
  mountedEditor,
  near,
  overlayIds,
  PIN_BUTTON,
  pins,
  placePin,
  pressAndMove,
  releaseAt,
  seed,
  tipOf
} from "./story-helpers"

const pinExtension = createPinExtension()

const meta = {
  title: "Features/Pin/Tool",
  render: () => <PinStoryCanvas extension={pinExtension} />,
  beforeEach() {
    sessionStorage.removeItem(FIRST_USE_HINT_STORAGE_KEY)
  }
} satisfies Meta

export default meta
type Story = StoryObj<typeof meta>

export const FirstUseHint: Story = {
  play: async ({ canvasElement, userEvent }) => {
    const editor = await mountedEditor(canvasElement)
    const queryHint = () => within(canvasElement).queryByText(FIRST_USE_HINT)

    editor.setCurrentTool(PIN_TOOL_ID)
    const hint = await within(canvasElement).findByText(FIRST_USE_HINT)
    await expect(hint.closest("output")).not.toBeNull()

    editor.getContainer().focus()
    await userEvent.keyboard("{Escape}")
    await waitFor(() => expect(editor.getCurrentToolId()).toBe("select"))
    await waitFor(() => expect(queryHint()).toBeNull())

    editor.setCurrentTool(PIN_TOOL_ID)
    await waitFor(() => expect(editor.getCurrentToolId()).toBe(PIN_TOOL_ID))
    await expect(queryHint()).toBeNull()
  }
}

export const ToolbarEntry: Story = {
  play: async ({ canvasElement, userEvent }) => {
    const editor = await mountedEditor(canvasElement)
    const button = await within(canvasElement).findByRole("button", { name: PIN_BUTTON })
    await expect(button.querySelector("svg")).not.toBeNull()

    await userEvent.keyboard("p")
    await expect(editor.getCurrentToolId()).toBe(PIN_TOOL_ID)

    await userEvent.keyboard("{Control>}{Alt>}/{/Alt}{/Control}")
    const dialog = await screen.findByRole("dialog")
    const row = within(within(dialog).getByTestId(`kbd.${PIN_TOOL_ID}`))
    await expect(row.getByText("Pin")).toBeInTheDocument()
    await expect(row.getByText("P")).toBeInTheDocument()
    await userEvent.keyboard("{Escape}")
  }
}

export const ReadonlyHidesTool: Story = {
  play: async ({ canvasElement }) => {
    const editor = await mountedEditor(canvasElement)
    await within(canvasElement).findByRole("button", { name: PIN_BUTTON })

    editor.updateInstanceState({ isReadonly: true })

    await waitFor(() =>
      expect(within(canvasElement).queryByRole("button", { name: PIN_BUTTON })).toBeNull()
    )
  }
}

export const ToolLockKeepsPinTool: Story = {
  play: async ({ canvasElement, userEvent }) => {
    const editor = await mountedEditor(canvasElement)
    seed(editor)
    editor.updateInstanceState({ isToolLocked: true })

    await placePin(userEvent, editor, canvasElement, A_AND_B)
    await expect(editor.getCurrentToolId()).toBe(PIN_TOOL_ID)

    await clickAt(userEvent, editor, EMPTY)
    await expect(pins(editor)).toHaveLength(2)
  }
}

export const UndoPlacementIsOneStep: Story = {
  play: async ({ canvasElement, userEvent }) => {
    const editor = await mountedEditor(canvasElement)
    seed(editor)
    await placePin(userEvent, editor, canvasElement, A_AND_B)

    editor.undo()
    await expect(pins(editor)).toHaveLength(0)
    await expect(editor.getBindingsInvolvingShape(A, PIN_BINDING)).toHaveLength(0)

    editor.redo()
    await expect(pins(editor)).toHaveLength(1)
    const [pin] = pins(editor)
    await expect(pin && held(editor, pin.id)).toEqual(new Set([A, B]))
  }
}

export const PressDragPlaces: Story = {
  play: async ({ canvasElement, userEvent }) => {
    const editor = await mountedEditor(canvasElement)
    seed(editor)
    await userEvent.click(within(canvasElement).getByRole("button", { name: PIN_BUTTON }))

    await dragFrom(userEvent, editor, EMPTY, A_AND_B)

    const [pin] = pins(editor)
    await expect(pin && tipOf(editor, pin.id)).toEqual(near(A_AND_B))
    await expect(pin && held(editor, pin.id)).toEqual(new Set([A, B]))
    await expect(editor.getCurrentToolId()).toBe("select")

    editor.undo()
    await expect(pins(editor)).toHaveLength(0)
  }
}

export const EscapeDuringPressDragRemovesPin: Story = {
  play: async ({ canvasElement, userEvent }) => {
    const editor = await mountedEditor(canvasElement)
    seed(editor)
    await userEvent.click(within(canvasElement).getByRole("button", { name: PIN_BUTTON }))

    await pressAndMove(userEvent, editor, EMPTY, A_AND_B)
    await expect(pins(editor)).toHaveLength(1)
    await userEvent.keyboard("{Escape}")
    await releaseAt(userEvent, editor, A_AND_B)

    await expect(pins(editor)).toHaveLength(0)
    await expect(allPinBindings(editor)).toEqual([])
    editor.undo()
    await expect(pins(editor)).toHaveLength(0)
  }
}

export const PinCannotResizeOrRotate: Story = {
  play: async ({ canvasElement, userEvent }) => {
    const editor = await mountedEditor(canvasElement)
    seed(editor)
    const pin = await placePin(userEvent, editor, canvasElement, A_AND_B)
    await expect(editor.getSelectedShapeIds()).toEqual([pin])
    await expect(overlayIds(editor, "selection_fg:")).toEqual([])

    await userEvent.keyboard("{Shift>}.{/Shift}")
    await expect(editor.getShape(pin)?.rotation).toBe(0)
    await expect(tipOf(editor, pin)).toEqual(near(A_AND_B))

    // Rotated with another shape, the tip travels with the selection; the pin stays upright.
    editor.select(pin, C)
    const centre = editor.getSelectionPageBounds()?.center
    if (!centre) throw new Error("no selection bounds")
    const tipBefore = tipOf(editor, pin)
    await userEvent.keyboard("{Shift>}.{/Shift}")
    const turn = editor.getShape(C)?.rotation ?? 0
    await expect(turn).not.toBe(0)
    await expect(editor.getShape(pin)?.rotation).toBe(0)
    await expect(tipOf(editor, pin)).toEqual(near(Vec.RotWith(tipBefore, centre, turn)))
  }
}
