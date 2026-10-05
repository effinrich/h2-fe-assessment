import type { Meta, StoryObj } from "@storybook/react-vite"

import { expect } from "storybook/test"

import { Box, Button, ColorModeButton, Text } from "@h2-fe/ui"

import { AppHeader } from "./app-header"

// Spec: one in-flow chrome row; the brand is decoration, never a tab stop.
const meta = {
  title: "Chrome/AppHeader",
  component: AppHeader,
  args: { end: <ColorModeButton /> }
} satisfies Meta<typeof AppHeader>

export default meta
type Story = StoryObj<typeof meta>

export const Home: Story = {
  play: async ({ canvas, userEvent }) => {
    await expect(canvas.getByRole("banner")).toBeVisible()
    await expect(canvas.getByText("Annotate")).toBeVisible()

    await userEvent.tab()
    await expect(canvas.getByRole("button", { name: /Switch to (light|dark) mode/ })).toHaveFocus()
  }
}

export const WithSlots: Story = {
  args: {
    start: <Text truncate>quarterly-report.pdf</Text>,
    children: <Text fontFamily="mono">3 / 12</Text>,
    end: (
      <>
        <ColorModeButton />
        <Button size="sm" variant="outline">
          Open another
        </Button>
      </>
    )
  },
  play: async ({ canvas }) => {
    await expect(canvas.getByText("quarterly-report.pdf")).toBeVisible()
    await expect(canvas.getByText("3 / 12")).toBeVisible()
    await expect(canvas.getByRole("button", { name: "Open another" })).toBeVisible()
  }
}

export const Narrow: Story = {
  ...WithSlots,
  decorators: [
    (Story) => (
      <Box width="390px">
        <Story />
      </Box>
    )
  ],
  play: async ({ canvas }) => {
    const banner = canvas.getByRole("banner")
    await expect(canvas.getByText("quarterly-report.pdf")).toBeVisible()
    await expect(canvas.getByRole("button", { name: "Open another" })).toBeVisible()
    await expect(banner.scrollWidth).toBeLessThanOrEqual(banner.clientWidth)
  }
}
