import type { Meta, StoryObj } from "@storybook/react-vite"
import { expect, fn } from "storybook/test"

import { ViewerTopBar } from "./viewer-top-bar"

// Spec: the viewer's "Open another document" affordance stays above the
// canvas. The button is the only receiving surface in the bar.
const meta = {
  title: "Chrome/ViewerTopBar",
  component: ViewerTopBar,
  args: { filename: "example.pdf", page: 1, totalPages: 3, onPageChange: fn(), onOpenAnother: fn() }
} satisfies Meta<typeof ViewerTopBar>

export default meta
type Story = StoryObj<typeof meta>

export const Default: Story = {
  play: async ({ args, canvas, userEvent }) => {
    await expect(canvas.getByRole("button", { name: "Previous page" })).toBeDisabled()
    await userEvent.click(canvas.getByRole("button", { name: "Next page" }))
    await expect(args.onPageChange).toHaveBeenCalledWith(2)
    await userEvent.click(canvas.getByRole("button", { name: "Open another document" }))
    await expect(args.onOpenAnother).toHaveBeenCalled()
  }
}

export const JumpToPage: Story = {
  play: async ({ args, canvas, userEvent }) => {
    const input = canvas.getByRole("spinbutton", { name: "Page number" })
    await userEvent.clear(input)
    await userEvent.type(input, "3{enter}")
    await expect(args.onPageChange).toHaveBeenCalledWith(3)
  }
}

export const LastPage: Story = {
  args: { page: 3, filename: "a-very-long-document-name-that-needs-truncating.pdf" },
  play: async ({ canvas }) => {
    await expect(canvas.getByRole("button", { name: "Next page" })).toBeDisabled()
  }
}

export const OnePage: Story = {
  args: { page: 1, totalPages: 1 },
  play: async ({ canvas }) => {
    await expect(canvas.getByRole("button", { name: "Next page" })).toBeDisabled()
    await expect(canvas.getByRole("button", { name: "Previous page" })).toBeDisabled()
  }
}
