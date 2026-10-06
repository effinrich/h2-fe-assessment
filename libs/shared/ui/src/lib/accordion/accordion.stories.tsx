import type { Meta, StoryObj } from '@storybook/react-vite'
import { expect, fn } from 'storybook/test'

import { Accordion } from './accordion'

const meta = {
  title: 'Navigation/Accordion',
  component: Accordion,
  args: {
    items: [
      {
        value: 'import',
        title: 'How do I import shapes?',
        content: 'Use the importer panel and pick a file.'
      },
      { value: 'pins', title: 'What is a pin?', content: 'A marker attached to a shape.' },
      { value: 'export', title: 'Can I export?', content: 'Not yet.', disabled: true }
    ],
    onValueChange: fn()
  }
} satisfies Meta<typeof Accordion>

export default meta
type Story = StoryObj<typeof meta>

export const Default: Story = {
  play: async ({ args, canvas, userEvent }) => {
    const trigger = canvas.getByRole('button', { name: 'How do I import shapes?' })
    await userEvent.click(trigger)
    await expect(trigger).toHaveAttribute('aria-expanded', 'true')
    await expect(args.onValueChange).toHaveBeenCalledWith(['import'])
  }
}

export const Multiple: Story = {
  args: { multiple: true, defaultValue: ['import', 'pins'] }
}

export const Enclosed: Story = {
  args: { variant: 'enclosed' }
}
