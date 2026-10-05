import type { Meta, StoryObj } from "@storybook/react-vite"

import { expect } from "storybook/test"

import { ColorModeButton } from "./color-mode-button"

const meta = {
  title: "Theme/ColorModeButton",
  component: ColorModeButton
} satisfies Meta<typeof ColorModeButton>

export default meta
type Story = StoryObj<typeof meta>

export const Default: Story = {
  play: async ({ canvas, userEvent }) => {
    const button = canvas.getByRole("button", { name: /Switch to (dark|light) mode/ })
    const before = button.getAttribute("aria-label")
    await userEvent.click(button)
    await expect(button.getAttribute("aria-label")).not.toBe(before)
    await userEvent.click(button)
  }
}
