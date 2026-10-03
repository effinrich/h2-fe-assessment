import type { Meta, StoryObj } from '@storybook/react-vite'
import { expect, fn } from 'storybook/test'
import { ViewerTopBar } from './viewer-top-bar'

// Spec: the viewer's "Open another document" affordance stays above the
// canvas. The button is the only receiving surface in the bar.
const meta = {
  title: 'Chrome/ViewerTopBar',
  component: ViewerTopBar,
  args: { onOpenAnother: fn() }
} satisfies Meta<typeof ViewerTopBar>

export default meta
type Story = StoryObj<typeof meta>

export const Default: Story = {
  play: async ({ args, canvas, userEvent }) => {
    await userEvent.click(canvas.getByRole('button', { name: 'Open another document' }))
    await expect(args.onOpenAnother).toHaveBeenCalled()
  }
}
