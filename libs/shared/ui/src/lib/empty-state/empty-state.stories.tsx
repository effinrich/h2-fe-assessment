import { Button } from '@chakra-ui/react'
import type { Meta, StoryObj } from '@storybook/react-vite'

import { MoonIcon } from '../color-mode-button/partials/moon-icon'
import { EmptyState } from './empty-state'

const meta = {
  title: 'Feedback/EmptyState',
  component: EmptyState,
  args: {
    title: 'No shapes yet',
    description: 'Import a file or draw on the canvas to get started.'
  }
} satisfies Meta<typeof EmptyState>

export default meta
type Story = StoryObj<typeof meta>

export const Default: Story = {}

export const WithIconAndAction: Story = {
  args: {
    icon: <MoonIcon />,
    children: <Button size="sm">Import file</Button>
  }
}

export const Small: Story = {
  args: { size: 'sm', description: undefined }
}
