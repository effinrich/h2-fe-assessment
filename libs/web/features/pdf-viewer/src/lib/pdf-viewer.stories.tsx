import type { Meta, StoryObj } from "@storybook/react-vite"

import { fn } from "storybook/test"

import type { RenderedPdfPage } from "./types"

import { PdfViewerScreen } from "./pdf-viewer"

// Storybook is the test surface for screen-level compositions; these stories
// carry the states the viewer owns.
const meta = {
  title: "Features/PdfViewer",
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
    "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg=="
}

const exampleDocument = {
  pages: [examplePage],
  renderPages: async () => [examplePage],
  destroy: async () => {}
}

export const Loading: Story = {
  args: { isLoading: true, onOpenAnother: fn() }
}

export const Error: Story = {
  args: { isError: true, onRetry: fn(), onOpenAnother: fn() }
}

export const Ready: Story = {
  // A long filename so the truncated label is what the story captures.
  args: { filename: "sample-annotated-report-2026-q3.pdf", onOpenAnother: fn() },
  render: (args) => <PdfViewerScreen {...args} document={exampleDocument} />
}
