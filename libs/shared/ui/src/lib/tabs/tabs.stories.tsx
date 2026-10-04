import type { Meta, StoryObj } from '@storybook/react-vite'
import { expect, fn } from 'storybook/test'

import { Tabs } from './tabs'

const meta = {
  title: 'Navigation/Tabs',
  component: Tabs,
  args: {
    items: [
      { value: 'shapes', label: 'Shapes', content: 'Every shape on the canvas.' },
      { value: 'pins', label: 'Pins', content: 'Pins attached to shapes.' },
      { value: 'history', label: 'History', content: 'Undo history.', disabled: true }
    ],
    onValueChange: fn()
  }
} satisfies Meta<typeof Tabs>

export default meta
type Story = StoryObj<typeof meta>

export const Default: Story = {
  play: async ({ args, canvas, userEvent }) => {
    await userEvent.click(canvas.getByRole('tab', { name: 'Pins' }))
    await expect(args.onValueChange).toHaveBeenCalledWith('pins')
    await expect(canvas.getByRole('tabpanel', { name: 'Pins' })).toHaveTextContent(
      'Pins attached to shapes.'
    )
  }
}

export const FirstEnabled: Story = {
  args: {
    items: [
      { value: 'disabled', label: 'Disabled', content: 'Not available.', disabled: true },
      { value: 'enabled', label: 'Enabled', content: 'Available.' }
    ]
  },
  play: async ({ canvas }) => {
    await expect(canvas.getByRole('tab', { name: 'Enabled' })).toHaveAttribute(
      'aria-selected',
      'true'
    )
  }
}

export const Enclosed: Story = {
  args: { variant: 'enclosed' }
}

export const Vertical: Story = {
  args: { orientation: 'vertical' }
}
