import { HStack } from '@chakra-ui/react'
import type { Meta, StoryObj } from '@storybook/react-vite'
import { expect } from 'storybook/test'

import { Avatar } from './avatar'

const meta = {
  title: 'Data display/Avatar',
  component: Avatar,
  args: { name: 'Ada Lovelace' }
} satisfies Meta<typeof Avatar>

export default meta
type Story = StoryObj<typeof meta>

export const Initials: Story = {
  play: async ({ canvas }) => {
    await expect(canvas.getByText('AL')).toBeVisible()
  }
}

export const WithImage: Story = {
  args: { src: 'https://i.pravatar.cc/120?img=47' }
}

export const Sizes: Story = {
  render: args => (
    <HStack gap="3">
      <Avatar {...args} size="xs" />
      <Avatar {...args} size="sm" />
      <Avatar {...args} size="md" />
      <Avatar {...args} size="lg" />
      <Avatar {...args} size="xl" />
    </HStack>
  )
}

export const Colored: Story = {
  args: { colorPalette: 'teal', variant: 'solid' }
}
