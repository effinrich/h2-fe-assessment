import type { Meta, StoryObj } from '@storybook/react-vite'
import { fn } from 'storybook/test'
import { PdfViewerScreen } from './pdf-viewer'
import type { RenderedPdfPage } from './types'

// Storybook is the test surface for screen-level compositions; these stories
// carry the three states the viewer owns. tldraw runs real for the Ready
// state, so Chromatic snapshots stay off for that story (diffing an animated
// canvas is a flake budget) — the states that matter visually are Loading and
// Error.
const meta = {
  title: 'Features/PdfViewer',
  component: PdfViewerScreen
} satisfies Meta<typeof PdfViewerScreen>

export default meta
type Story = StoryObj<typeof meta>

// A real (tiny) PNG so placements have a real in-browser source while the
// story exercises the placement path with actual image data.
const examplePage: RenderedPdfPage = {
  pageNumber: 1,
  width: 200,
  height: 283,
  dataUrl:
    'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg=='
}

export const Loading: Story = {
  args: { isLoading: true, onOpenAnother: fn() }
}

export const Error: Story = {
  args: { isError: true, onRetry: fn(), onOpenAnother: fn() }
}

export const Ready: Story = {
  args: { pages: [examplePage], onOpenAnother: fn() },
  parameters: { chromatic: { disableSnapshot: true } }
}
