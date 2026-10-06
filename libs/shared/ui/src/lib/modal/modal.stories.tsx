import { Button, Text } from '@chakra-ui/react'
import type { Meta, StoryObj } from '@storybook/react-vite'
import { expect, screen, waitFor, waitForElementToBeRemoved } from 'storybook/test'

import { Modal } from './modal'

const meta = {
  title: 'Overlay/Modal',
  component: Modal,
  args: {
    title: 'Delete shape',
    children: <Text>This removes the shape and every pin attached to it.</Text>,
    trigger: <Button variant="outline">Open modal</Button>
  },
  parameters: {
    a11y: {
      // axe always reports aria-controls on an aria-haspopup trigger as "needs review", whether or not the id resolves.
      config: { checks: [{ id: 'aria-valid-attr-value', options: ['aria-controls'] }] }
    }
  }
} satisfies Meta<typeof Modal>

export default meta
type Story = StoryObj<typeof meta>

export const Default: Story = {
  play: async ({ canvas, userEvent }) => {
    await userEvent.click(canvas.getByRole('button', { name: 'Open modal' }))
    const dialog = await screen.findByRole('dialog', { name: 'Delete shape' })

    await waitFor(() => expect(dialog).toBeVisible())

    await userEvent.click(screen.getByRole('button', { name: 'Close' }))
    await waitForElementToBeRemoved(() => screen.queryByRole('dialog', { name: 'Delete shape' }))
  }
}

export const WithFooter: Story = {
  args: {
    footer: (
      <>
        <Button variant="outline">Cancel</Button>
        <Button colorPalette="red">Delete</Button>
      </>
    )
  }
}

export const Large: Story = {
  args: { size: 'lg' }
}
