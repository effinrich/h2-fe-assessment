import type { Meta, StoryObj } from "@storybook/react-vite"

import { expect, fn, waitFor } from "storybook/test"

import { HomeScreen } from "./home-screen"

// Storybook is the test surface for this route's screen; the play function
// here carries criterion 1 of docs/specs/task-2-pdf.md end-to-end in the
// browser, and Chromatic diffs the visual surface.
const meta = {
  title: "Routes/Home",
  component: HomeScreen,
  parameters: { layout: "fullscreen" },
  args: { onFileChange: fn(), onDropFile: fn(), onRejectDrop: fn(), onUseExample: fn() }
} satisfies Meta<typeof HomeScreen>

export default meta
type Story = StoryObj<typeof meta>

export const Idle: Story = {
  play: async ({ args, canvas, canvasElement, userEvent }) => {
    const openPdf = canvas.getByRole("button", { name: "Open PDF" })
    await expect(openPdf).toBeEnabled()
    await expect(canvas.getByRole("button", { name: "Use an example" })).toBeEnabled()
    await expect(canvas.getByRole("banner")).toBeVisible()
    await expect(canvas.getByText(/Pin shapes together/)).toBeVisible()
    await expect(canvas.getByText(/Export an area/)).toBeVisible()
    await expect(canvas.getByText(/Draw, write, highlight/)).toBeVisible()

    const input = canvasElement.querySelector('input[type="file"]')
    if (!(input instanceof HTMLInputElement)) {
      throw new Error("expected a file input inside FileUpload")
    }
    const file = new File(["%PDF-1.4"], "pick.pdf", { type: "application/pdf" })
    await userEvent.upload(input, file)
    await expect(args.onFileChange).toHaveBeenCalled()
  }
}

export const Busy: Story = {
  args: { isBusy: true },
  play: async ({ canvas }) => {
    await expect(canvas.getByRole("button", { name: "Opening" })).toBeDisabled()
    await expect(canvas.getByRole("button", { name: "Use an example" })).toBeDisabled()
  }
}

// Native DragEvents carrying a real DataTransfer. fireEvent would copy the
// DataTransfer's own properties onto a new one, and a real one has none.
export const DropAPdf: Story = {
  play: async ({ args, canvas }) => {
    const target = canvas.getByRole("main")
    const file = new File(["%PDF-1.4"], "dropped.pdf", { type: "application/pdf" })
    const dataTransfer = new DataTransfer()
    dataTransfer.items.add(file)
    const drag = (type: string) =>
      target.dispatchEvent(new DragEvent(type, { bubbles: true, cancelable: true, dataTransfer }))

    drag("dragover")
    await expect(await canvas.findByText("Drop to open")).toBeVisible()

    drag("drop")
    await expect(args.onDropFile).toHaveBeenCalledWith(file)
    await waitFor(() => expect(canvas.queryByText("Drop to open")).toBeNull())
  }
}
