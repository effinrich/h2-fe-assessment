import type { Meta, StoryObj } from '@storybook/react-vite'
import { expect, fn } from 'storybook/test'

import { Checkbox } from './checkbox'

const meta = {
  title: 'Forms/Checkbox',
  component: Checkbox,
  args: { children: 'Snap shapes to the grid', onCheckedChange: fn() }
} satisfies Meta<typeof Checkbox>

export default meta
type Story = StoryObj<typeof meta>

export const Default: Story = {
  play: async ({ args, canvas, userEvent }) => {
    await userEvent.click(canvas.getByText('Snap shapes to the grid'))
    await expect(args.onCheckedChange).toHaveBeenCalledWith(true)
  }
}

export const Checked: Story = {
  args: { defaultChecked: true }
}

export const Indeterminate: Story = {
  args: { checked: 'indeterminate' }
}

export const Disabled: Story = {
  args: { disabled: true }
}
