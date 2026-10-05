import type { Meta, StoryObj } from "@storybook/react-vite"

import { expect, fn } from "storybook/test"

import { ViewerTopBar } from "./viewer-top-bar"

const PHONE_VIEWPORT = {
  phone: { name: "Phone", styles: { width: "390px", height: "844px" }, type: "mobile" }
} as const

// Spec: the viewer's "Open another document" affordance stays above the
// canvas. Color mode is the other control in this strip; both receive events.
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
    await userEvent.type(input, "3")
    // Browsers submit a lone number field on Enter; user-event leaves `number`
    // out of its implicit-submission types, so submit the way the browser does.
    input.closest("form")?.requestSubmit()
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

// The test browser's viewport, not a narrow box: `hideBelow` reads media queries.
export const NarrowKeyboard: Story = {
  parameters: { viewport: { options: PHONE_VIEWPORT } },
  globals: { viewport: { value: "phone" } },
  play: async ({ canvas, userEvent }) => {
    const banner = canvas.getByRole("banner")
    const filename = canvas.getByText("example.pdf")
    const page = canvas.getByRole("spinbutton", { name: "Page number" })
    const next = canvas.getByRole("button", { name: "Next page" })
    const open = canvas.getByRole("button", { name: "Open another document" })

    // The brand and the button's text yield so the file name keeps its room.
    await expect(canvas.getByText("Annotate")).not.toBeVisible()
    await expect(canvas.getByText("Open another")).not.toBeVisible()
    await expect(filename).toBeVisible()
    await expect(filename.getBoundingClientRect().width).toBeGreaterThan(40)
    await expect(open).toBeVisible()
    await expect(banner.scrollWidth).toBeLessThanOrEqual(banner.clientWidth)

    await userEvent.tab()
    await expect(page).toHaveFocus()
    await userEvent.tab()
    await expect(next).toHaveFocus()
    await userEvent.tab()
    await expect(canvas.getByRole("button", { name: /Switch to (light|dark) mode/ })).toHaveFocus()
    await userEvent.tab()
    await expect(open).toHaveFocus()
  }
}
