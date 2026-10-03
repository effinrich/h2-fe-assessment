import { fireEvent, render, screen } from '@testing-library/react'
import { UiProvider } from '@h2-fe/ui'
import { afterEach, describe, expect, it, vi } from 'vitest'
import type { Editor } from 'tldraw'
import { PDF_PAGE_GAP } from './consts'
import { PdfViewerScreen } from './pdf-viewer'
import { placePagesOnCanvas } from './utils'
import type { PdfViewerScreenProps, RenderedPdfPage } from './types'

// jsdom cannot rasterise (no 2d canvas), so renderPdf is not unit-testable —
// that verdict lives in docs/specs/task-2-pdf.md. What is covered here: the
// screen's three state surfaces, driven entirely by props, and the placement
// seam. tldraw is stubbed the same way the app spec does it.
vi.mock('tldraw', () => ({
  AssetRecordType: { create: (input: Record<string, unknown>) => input },
  Tldraw: () => <div data-testid="tldraw" />
}))

const editorStub = {
  createAssets: vi.fn<(assets: object[]) => void>(),
  createShapes: vi.fn<(shapes: object[]) => void>(),
  deleteAssets: vi.fn<(ids: string[]) => void>(),
  deleteShapes: vi.fn<(ids: string[]) => void>(),
  zoomToFit: vi.fn<(opts?: unknown) => void>()
}

const page: RenderedPdfPage = { pageNumber: 1, width: 100, height: 140, dataUrl: '' }
const page2: RenderedPdfPage = { pageNumber: 2, width: 100, height: 140, dataUrl: '' }

function renderScreen(props: PdfViewerScreenProps) {
  return render(
    <UiProvider>
      <PdfViewerScreen {...props} />
    </UiProvider>
  )
}

afterEach(() => {
  vi.clearAllMocks()
})

describe('PdfViewerScreen', () => {
  it('mounts the canvas surface', () => {
    renderScreen({ onOpenAnother: vi.fn<() => void>() })
    expect(screen.getByTestId('tldraw')).toBeTruthy()
  })

  it('shows the loading state while the document rasterises', () => {
    renderScreen({ isLoading: true, onOpenAnother: vi.fn<() => void>() })
    expect(screen.getByTestId('viewer-loading')).toBeTruthy()
  })

  it('shows the error surface with a working retry', () => {
    const onRetry = vi.fn<() => void>()
    renderScreen({ isError: true, onRetry, onOpenAnother: vi.fn<() => void>() })
    expect(screen.getByRole('alert')).toBeTruthy()
    fireEvent.click(screen.getByRole('button', { name: /try again/i }))
    expect(onRetry).toHaveBeenCalledTimes(1)
  })

  it('offers Open another document when a document is on the canvas', () => {
    const onOpenAnother = vi.fn<() => void>()
    renderScreen({ pages: [page], onOpenAnother })
    fireEvent.click(screen.getByRole('button', { name: /open another document/i }))
    expect(onOpenAnother).toHaveBeenCalledTimes(1)
  })
})

describe('placePagesOnCanvas', () => {
  it('places pages as locked shapes stacked with the page gap', () => {
    placePagesOnCanvas(editorStub as unknown as Editor, [page, page2])

    const shapes = editorStub.createShapes.mock.calls[0][0] as {
      id: string
      isLocked: boolean
      y: number
      props: { assetId: string; w: number; h: number }
    }[]
    expect(shapes).toHaveLength(2)
    expect(shapes[0]).toEqual({
      id: 'shape:page-1',
      type: 'image',
      x: 0,
      y: 0,
      isLocked: true,
      props: { assetId: 'asset:page-1', w: 100, h: 140 }
    })
    expect(shapes[1].y).toBe(page.height + PDF_PAGE_GAP)

    const assets = editorStub.createAssets.mock.calls[0][0] as {
      id: string
      props: { src: string }
    }[]
    expect(assets).toHaveLength(2)
    expect(assets[0].id).toBe('asset:page-1')
    expect(editorStub.zoomToFit).toHaveBeenCalledTimes(1)
  })

  it('replaces pages in place instead of stacking a second copy', () => {
    placePagesOnCanvas(editorStub as unknown as Editor, [page])
    placePagesOnCanvas(editorStub as unknown as Editor, [page])

    // The second placement deletes the stale shapes and assets before creating
    // fresh ones with the same stable ids — the replacement contract.
    const firstShapeCall = editorStub.createShapes.mock.invocationCallOrder[0]
    const secondDeleteCall = editorStub.deleteShapes.mock.invocationCallOrder[1]
    const secondCreateCall = editorStub.createShapes.mock.invocationCallOrder[1]
    expect(secondDeleteCall).toBeGreaterThan(firstShapeCall)
    expect(secondCreateCall).toBeGreaterThan(secondDeleteCall)
  })
})
