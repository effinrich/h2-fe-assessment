import type { Meta, StoryObj } from "@storybook/react-vite"

import { expect, fn, screen, waitFor, within } from "storybook/test"
import {
  atom,
  type BoxModel,
  createShapeId,
  type Editor,
  StateNode,
  tleditors,
  useValue
} from "tldraw"

import type {
  CanvasExtension,
  PdfDocumentSummary,
  PdfViewerScreenProps,
  RenderedPdfPage
} from "./types"

import { PDF_PAGE_GAP } from "./consts"
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

const PAGE_1 = createShapeId("page-1")
const PAGE_2 = createShapeId("page-2")

function mountedEditor(canvasElement: HTMLElement): Editor | undefined {
  return tleditors.getMounted().find((mounted) => canvasElement.contains(mounted.getContainer()))
}

function pageAssets(editor: Editor | undefined, pageNumber: number) {
  return (editor?.getAssets() ?? []).filter((asset) =>
    asset.id.startsWith(`asset:page-${pageNumber}-`)
  )
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

let landRaster = () => {}
const deferredDocument: PdfDocumentSummary = {
  pages: [examplePage],
  renderPages: () =>
    new Promise((resolve) => {
      landRaster = () => resolve([examplePage])
    }),
  destroy: async () => {}
}

function countFrames(): () => number {
  let frames = 0
  let counting = true
  const tick = () => {
    if (!counting) return
    frames++
    requestAnimationFrame(tick)
  }
  requestAnimationFrame(tick)
  return () => {
    counting = false
    return frames
  }
}

// Counted in frames rather than milliseconds, so the bound holds at any frame rate.
export const RasterLandsPromptly: Story = {
  args: { filename: "example.pdf", onOpenAnother: fn() },
  render: (args) => <PdfViewerScreen {...args} document={deferredDocument} />,
  play: async ({ canvas, canvasElement }) => {
    await canvas.findByLabelText("Loading page 1")
    const stopCounting = countFrames()
    landRaster()
    await waitFor(
      () => expect(canvasElement.querySelector(`img[src="${examplePage.dataUrl}"]`)).not.toBeNull(),
      { timeout: 5000 }
    )
    await expect(stopCounting()).toBeLessThan(8)
  }
}

const secondPage: RenderedPdfPage = { ...examplePage, pageNumber: 2 }
const twoPageDocument: PdfDocumentSummary = {
  pages: [examplePage, secondPage],
  renderPages: async (pageNumbers) =>
    pageNumbers.map((pageNumber) => (pageNumber === 1 ? examplePage : secondPage)),
  destroy: async () => {}
}
const retainedBoxes = atom<readonly BoxModel[]>("retained page boxes", [])

export const EvictsOffscreenPages: Story = {
  args: {
    filename: "example.pdf",
    onOpenAnother: fn(),
    retainPageBounds: () => retainedBoxes.get()
  },
  beforeEach: () => {
    retainedBoxes.set([])
  },
  render: (args) => <PdfViewerScreen {...args} document={twoPageDocument} />,
  play: async ({ canvasElement }) => {
    await waitFor(() => expect(mountedEditor(canvasElement)?.getShape(PAGE_1)).toBeDefined())
    const editor = mountedEditor(canvasElement)
    retainedBoxes.set([{ x: 10, y: 10, w: 50, h: 50 }])
    editor?.setCamera({ x: 0, y: -(examplePage.height + PDF_PAGE_GAP), z: 1 })

    await waitFor(() => expect(editor?.getShape(PAGE_2)).toBeDefined())
    await expect(editor?.getShape(PAGE_1)).toBeDefined()

    retainedBoxes.set([])
    await waitFor(() => expect(editor?.getShape(PAGE_1)).toBeUndefined())
    await expect(pageAssets(editor, 1)).toEqual([])
    await expect(editor?.getShape(PAGE_2)).toBeDefined()
  }
}

const widePage: RenderedPdfPage = { ...examplePage, width: 300, height: 150 }
const wideDocument: PdfDocumentSummary = {
  pages: [widePage],
  renderPages: async () => [widePage],
  destroy: async () => {}
}
const shownDocument = atom<PdfDocumentSummary>("shown document", exampleDocument)

function SwitchingViewer(props: PdfViewerScreenProps) {
  const document = useValue(shownDocument)
  return <PdfViewerScreen {...props} document={document} />
}

export const SwitchesDocument: Story = {
  args: { filename: "example.pdf", onOpenAnother: fn() },
  beforeEach: () => {
    shownDocument.set(exampleDocument)
  },
  render: (args) => <SwitchingViewer {...args} />,
  play: async ({ canvasElement }) => {
    await waitFor(() =>
      expect(mountedEditor(canvasElement)?.getShape(PAGE_1)).toMatchObject({
        props: { w: examplePage.width, h: examplePage.height }
      })
    )
    const editor = mountedEditor(canvasElement)

    shownDocument.set(wideDocument)
    await waitFor(() =>
      expect(editor?.getShape(PAGE_1)).toMatchObject({
        props: { w: widePage.width, h: widePage.height }
      })
    )
    await expect(pageAssets(editor, 1).map((asset) => asset.props)).toEqual([
      expect.objectContaining({ w: widePage.width, h: widePage.height })
    ])
  }
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
    const editor = mountedEditor(canvasElement)

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
