import type { Meta, StoryObj } from "@storybook/react-vite"

import { expect } from "storybook/test"

import { Button } from "../button/button"
import { Field, FileUpload, Input, Textarea } from "./forms"
import { Stack } from "./layout"

const meta = {
  title: "Primitives/Forms"
} satisfies Meta

export default meta
type Story = StoryObj

export const Inputs: Story = {
  render: () => (
    <Stack gap="4" maxW="sm">
      <Input placeholder="Outline (default)" />
      <Input variant="subtle" placeholder="Subtle" />
      <Input variant="flushed" placeholder="Flushed" />
      <Textarea placeholder="Textarea" />
    </Stack>
  )
}

export const ComposedField: Story = {
  render: () => (
    <Field.Root maxW="sm">
      <Field.Label>Notes</Field.Label>
      <Textarea placeholder="Anything we should know?" />
      <Field.HelperText>Field wires the label and helper text to the control.</Field.HelperText>
    </Field.Root>
  )
}

export const PdfUpload: Story = {
  render: () => (
    <FileUpload.Root accept="application/pdf" maxFiles={1}>
      <FileUpload.HiddenInput />
      <FileUpload.Trigger asChild>
        <Button>Open PDF</Button>
      </FileUpload.Trigger>
    </FileUpload.Root>
  ),
  play: async ({ canvas, canvasElement }) => {
    await expect(canvas.getByRole("button", { name: "Open PDF" })).toBeEnabled()
    await expect(canvasElement.querySelector('input[type="file"]')).toBeTruthy()
  }
}
