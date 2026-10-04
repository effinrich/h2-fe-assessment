import { Button, Wrap } from '@chakra-ui/react'
import type { Meta, StoryObj } from '@storybook/react-vite'
import { expect, screen } from 'storybook/test'

import { toaster } from './consts'
import { Toaster } from './toaster'

// The Storybook decorator's UiProvider already mounts <Toaster />, so these
// stories only push toasts into the shared store.
const meta = {
  title: 'Feedback/Toaster',
  component: Toaster
} satisfies Meta<typeof Toaster>

export default meta
type Story = StoryObj<typeof meta>

export const Types: Story = {
  render: () => (
    <Wrap gap="3">
      <Button
        onClick={() =>
          toaster.create({
            title: 'Saved',
            description: 'Your board is up to date.',
            type: 'success'
          })
        }
      >
        Success
      </Button>
      <Button
        onClick={() =>
          toaster.create({
            title: 'Upload failed',
            description: 'The PDF is over 20 MB.',
            type: 'error',
            closable: true
          })
        }
      >
        Error
      </Button>
      <Button
        onClick={() =>
          toaster.create({
            title: 'Heads up',
            description: 'Pins follow moved shapes.',
            type: 'info'
          })
        }
      >
        Info
      </Button>
      <Button onClick={() => toaster.create({ title: 'Importing…', type: 'loading' })}>
        Loading
      </Button>
    </Wrap>
  ),
  play: async ({ canvas, userEvent }) => {
    await userEvent.click(canvas.getByRole('button', { name: 'Success' }))
    await expect(await screen.findByText('Your board is up to date.')).toBeInTheDocument()
  }
}

export const WithAction: Story = {
  render: () => (
    <Button
      onClick={() =>
        toaster.create({
          title: 'Shape deleted',
          type: 'info',
          action: {
            label: 'Undo',
            onClick: () => toaster.create({ title: 'Restored', type: 'success' })
          }
        })
      }
    >
      Delete shape
    </Button>
  ),
  play: async ({ canvas, userEvent }) => {
    await userEvent.click(canvas.getByRole('button', { name: 'Delete shape' }))
    await userEvent.click(await screen.findByRole('button', { name: 'Undo' }))
    // The toaster is a shared store, so a re-run of the story can leave more
    // than one toast with this title mounted. Assert presence, not uniqueness.
    await expect((await screen.findAllByText('Restored')).length).toBeGreaterThan(0)
  }
}
