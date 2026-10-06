import { HStack } from '@chakra-ui/react'
import type { Meta, StoryObj } from '@storybook/react-vite'
import { expect, fn } from 'storybook/test'

import { Tag } from './tag'

const meta = {
  title: 'Data display/Tag',
  component: Tag,
  args: { children: 'rectangle' }
} satisfies Meta<typeof Tag>

export default meta
type Story = StoryObj<typeof meta>

export const Default: Story = {}

export const Closable: Story = {
  args: { onClose: fn() },
  play: async ({ args, canvas, userEvent }) => {
    await userEvent.click(canvas.getByRole('button', { name: 'Remove' }))
    await expect(args.onClose).toHaveBeenCalled()
  }
}

export const Variants: Story = {
  render: args => (
    <HStack gap="2">
      <Tag {...args} variant="subtle" />
      <Tag {...args} variant="solid" />
      <Tag {...args} variant="outline" />
      <Tag {...args} variant="surface" colorPalette="teal" />
    </HStack>
  )
}
