import type { Meta, StoryObj } from "@storybook/react-vite"

import { expect } from "storybook/test"

import { Button, ColorModeButton, Text } from "@h2-fe/ui"

import { AppHeader } from "./app-header"

const PHONE_VIEWPORT = {
  phone: { name: "Phone", styles: { width: "390px", height: "844px" }, type: "mobile" }
} as const


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

// The test browser's viewport, not a narrow box: `hideBelow` reads media queries.
export const Phone: Story = {
  ...WithSlots,
  parameters: { viewport: { options: PHONE_VIEWPORT } },
  globals: { viewport: { value: "phone" } },
  play: async ({ canvas }) => {
    const banner = canvas.getByRole("banner")
    const filename = canvas.getByText("quarterly-report.pdf")
    // The file name is the context that matters on a phone; the brand yields.
    await expect(canvas.getByText("Annotate")).not.toBeVisible()
    await expect(filename).toBeVisible()
    await expect(filename.getBoundingClientRect().width).toBeGreaterThan(40)
    await expect(canvas.getByRole("button", { name: "Open another" })).toBeVisible()
    await expect(banner.scrollWidth).toBeLessThanOrEqual(banner.clientWidth)
  }
}

export const PhoneWithoutContext: Story = {
  parameters: { viewport: { options: PHONE_VIEWPORT } },
  globals: { viewport: { value: "phone" } },
  play: async ({ canvas }) => {
    await expect(canvas.getByText("Annotate")).toBeVisible()
  }
}
