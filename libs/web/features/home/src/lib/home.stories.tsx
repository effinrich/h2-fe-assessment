import type { Meta, StoryObj } from '@storybook/react-vite'
import { fn } from 'storybook/test'
import { HomeScreen } from './home'

// Storybook is the test surface for screen-level compositions; the play
// function here carries criterion 1 of docs/specs/task-2-pdf.md end-to-end in
// the browser, and Chromatic diffs the visual surface.
const meta = {
  title: 'Features/Home',
  component: HomeScreen,
  args: { onFileChange: fn(), onUseExample: fn() }
} satisfies Meta<typeof HomeScreen>

export default meta
type Story = StoryObj<typeof meta>

export const Idle: Story = {}

export const Busy: Story = {
  args: { isBusy: true }
}
