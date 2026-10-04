import type { Meta, StoryObj } from "@storybook/react-vite"

import { expect, fn } from "storybook/test"

import { HomeScreen } from "./home"

// Storybook is the test surface for screen-level compositions; the play
// function here carries criterion 1 of docs/specs/task-2-pdf.md end-to-end in
// the browser, and Chromatic diffs the visual surface.
const meta = {
  title: "Features/Home",
  component: HomeScreen,
  args: { onFileChange: fn(), onUseExample: fn() }
} satisfies Meta<typeof HomeScreen>

export default meta
type Story = StoryObj<typeof meta>

export const Idle: Story = {
  play: async ({ args, canvas, canvasElement, userEvent }) => {
    const openPdf = canvas.getByRole("button", { name: "Open PDF" })
    await expect(openPdf).toBeEnabled()
    await expect(canvas.getByRole("button", { name: "Use an example" })).toBeEnabled()

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
