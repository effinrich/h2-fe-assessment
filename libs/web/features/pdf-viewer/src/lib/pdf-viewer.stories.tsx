import type { Meta, StoryObj } from "@storybook/react-vite"

import { expect, fn, screen, within } from "storybook/test"
import { StateNode, tleditors } from "tldraw"

import type { CanvasExtension, RenderedPdfPage } from "./types"

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
  args: { isLoading: true, onOpenAnother: fn() },
  play: async ({ canvas }) => {
    await expect(canvas.getByRole("status", { name: "Opening the document" })).toBeInTheDocument()
  }
}

export const Error: Story = {
  args: { isError: true, onRetry: fn(), onOpenAnother: fn() }
}

export const Ready: Story = {
  // A long filename so the truncated label is what the story captures.
  args: { filename: "sample-annotated-report-2026-q3.pdf", onOpenAnother: fn() },
  render: (args) => <PdfViewerScreen {...args} document={exampleDocument} />
}

const STAMP_TOOL = "viewer-test-stamp"

class StampTool extends StateNode {
  static override id = STAMP_TOOL
}

function StampReady() {
  return <output>Stamp extension mounted</output>
}

// A stand-in for a feature lib's extension: one tool with its UI entry, an
// in-front component, and an onMount side effect the play test can observe.
const stampExtensions: CanvasExtension[] = [
  {
    toolIds: [STAMP_TOOL],
    tools: [StampTool],
    overrides: {
      tools: (editor, tools) => ({
        ...tools,
        [STAMP_TOOL]: {
          id: STAMP_TOOL,
          label: "Stamp",
          icon: "geo-star",
          kbd: "j",
          onSelect: () => editor.setCurrentTool(STAMP_TOOL)
        }
      })
    },
    InFrontOfTheCanvas: StampReady,
    onMount: (editor) => {
      editor.updateInstanceState({ isGridMode: true })
    }
  }
]

export const WithExtensions: Story = {
  args: { filename: "sample-annotated-report-2026-q3.pdf", onOpenAnother: fn() },
  render: (args) => (
    <PdfViewerScreen {...args} document={exampleDocument} extensions={stampExtensions} />
  ),
  play: async ({ canvas, canvasElement, userEvent }) => {
    const stamp = await canvas.findByRole("button", { name: "Stamp — J" })
    const editor = tleditors
      .getMounted()
      .find((mounted) => canvasElement.contains(mounted.getContainer()))

    await expect(editor?.getInstanceState().isGridMode).toBe(true)
    await expect(canvas.getByText("Stamp extension mounted")).toBeInTheDocument()

    await userEvent.click(stamp)
    await expect(editor?.getCurrentToolId()).toBe(STAMP_TOOL)

    await userEvent.keyboard("{Control>}{Alt>}/{/Alt}{/Control}")
    const dialog = await screen.findByRole("dialog")
    await expect(within(dialog).getByText("Document tools")).toBeInTheDocument()
    await expect(within(dialog).getByText("Stamp")).toBeInTheDocument()
    await userEvent.keyboard("{Escape}")
  }
}
