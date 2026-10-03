import { fireEvent, render, screen } from '@testing-library/react'
import { UiProvider } from '@h2-fe/ui'
import { afterEach, describe, expect, it, vi } from 'vitest'
import type { Editor } from 'tldraw'
import * as pdfjs from 'pdfjs-dist'
import { PDF_PAGE_GAP } from './consts'
import { PdfViewerScreen } from './pdf-viewer'
import { openPdf, placePagesOnCanvas, syncVisiblePages, visiblePageNumbers } from './utils'
import { pdfFileToken } from './hooks'
import type { PdfPage, PdfViewerScreenProps, RenderedPdfPage } from './types'

// jsdom cannot rasterise real PDFs, so PDF.js and tldraw are stubbed. These
// tests cover the screen states, file identity, viewport selection, cleanup,
// and canvas placement.
vi.mock('tldraw', () => ({
  AssetRecordType: { create: (input: Record<string, unknown>) => input },
  Tldraw: () => <div data-testid="tldraw" />
}))

vi.mock('pdfjs-dist', () => ({
  GlobalWorkerOptions: {},
  getDocument: vi.fn()
}))

const page: RenderedPdfPage = { pageNumber: 1, width: 100, height: 140, dataUrl: '' }
const page2: RenderedPdfPage = { pageNumber: 2, width: 100, height: 140, dataUrl: '' }
const exampleDocument = {
  pages: [page],
  renderPages: vi.fn(async () => [page]),
  destroy: vi.fn(async () => {})
}

function createEditorStub() {
  const assets = new Map<string, object>()
  const shapes = new Map<string, object>()
  return {
    createAssets: vi.fn((items: { id: string }[]) => items.forEach(asset => assets.set(asset.id, asset))),
    createShapes: vi.fn((items: { id: string }[]) => items.forEach(shape => shapes.set(shape.id, shape))),
    deleteAssets: vi.fn((ids: string[]) => ids.forEach(id => assets.delete(id))),
    deleteShapes: vi.fn((ids: string[]) => ids.forEach(id => shapes.delete(id))),
    updateAssets: vi.fn((items: { id: string }[]) => items.forEach(asset => assets.set(asset.id, asset))),
    getAsset: vi.fn((id: string) => assets.get(id)),
    getShape: vi.fn((id: string) => shapes.get(id)),
    zoomToFit: vi.fn<(opts?: unknown) => void>()
  }
}

function renderScreen(props: PdfViewerScreenProps) {
  return render(
    <UiProvider>
      <PdfViewerScreen {...props} />
    </UiProvider>
  )
}

afterEach(() => {
  vi.restoreAllMocks()
  vi.clearAllMocks()
  vi.mocked(pdfjs.getDocument).mockReset()
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
    renderScreen({ document: exampleDocument, onOpenAnother })
    fireEvent.click(screen.getByRole('button', { name: /open another document/i }))
    expect(onOpenAnother).toHaveBeenCalledTimes(1)
  })
})

describe('placePagesOnCanvas', () => {
  it('starts with the first page so zoom-to-fit does not rasterise the full document', () => {
    const editorStub = createEditorStub()
    placePagesOnCanvas(editorStub as unknown as Editor, [page, page2])

    const shapes = editorStub.createShapes.mock.calls[0][0] as {
      id: string
      isLocked: boolean
      y: number
      props: { assetId: string; w: number; h: number }
    }[]
    expect(shapes).toHaveLength(1)
    expect(shapes[0]).toEqual({
      id: 'shape:page-1',
      type: 'image',
      x: 0,
      y: 0,
      isLocked: true,
      props: { assetId: 'asset:page-1', w: 100, h: 140 }
    })
    expect(editorStub.createAssets.mock.calls[0][0]).toHaveLength(1)
    expect(editorStub.zoomToFit).toHaveBeenCalledTimes(1)
  })

  it('releases page shapes and assets when they leave the viewport', () => {
    const editorStub = createEditorStub()
    placePagesOnCanvas(editorStub as unknown as Editor, [page, page2])

    syncVisiblePages(editorStub as unknown as Editor, [page, page2], [2], [page2])
    expect(editorStub.deleteShapes).toHaveBeenCalledWith(['shape:page-1'])
    expect(editorStub.deleteAssets).toHaveBeenCalledWith(['asset:page-1'])

    syncVisiblePages(editorStub as unknown as Editor, [page, page2], [], [])
    expect(editorStub.deleteShapes).toHaveBeenLastCalledWith(['shape:page-2'])
    expect(editorStub.deleteAssets).toHaveBeenLastCalledWith(['asset:page-2'])
  })
})

describe('PDF page virtualization', () => {
  it('selects only pages intersecting the viewport', () => {
    const pages: PdfPage[] = Array.from({ length: 100 }, (_, index) => ({
      pageNumber: index + 1,
      width: 100,
      height: 140
    }))
    expect(visiblePageNumbers(pages, { x: 0, y: 0, w: 100, h: 140 })).toEqual([1])
    expect(
      visiblePageNumbers(pages, {
        x: 0,
        y: page.height + PDF_PAGE_GAP,
        w: 100,
        h: 140
      })
    ).toEqual([2])
    expect(visiblePageNumbers(pages, { x: 101, y: 0, w: 100, h: 140 })).toEqual([])
  })

  it('destroys the loading task when opening a document fails', async () => {
    const loadingTask = {
      promise: Promise.reject(new Error('invalid PDF')),
      destroy: vi.fn(async () => {})
    }
    vi.mocked(pdfjs.getDocument).mockReturnValue(loadingTask as never)

    await expect(openPdf(new ArrayBuffer(0))).rejects.toThrow('invalid PDF')
    expect(loadingTask.destroy).toHaveBeenCalledTimes(1)
  })

  it('destroys the loading task when rendering a visible page fails', async () => {
    const renderError = new Error('render failed')
    const pdfPage = {
      getViewport: () => ({ width: 100, height: 140 }),
      render: () => ({ promise: Promise.reject(renderError) })
    }
    const loadingTask = {
      promise: Promise.resolve({
        numPages: 1,
        getPage: vi.fn(async () => pdfPage)
      }),
      destroy: vi.fn(async () => {})
    }
    vi.mocked(pdfjs.getDocument).mockReturnValue(loadingTask as never)
    vi.spyOn(HTMLCanvasElement.prototype, 'getContext').mockReturnValue(
      {} as CanvasRenderingContext2D
    )

    const document = await openPdf(new ArrayBuffer(0))
    await expect(document.renderPages([1])).rejects.toThrow(renderError)
    expect(loadingTask.destroy).toHaveBeenCalledTimes(1)
  })
})

describe('pdfFileToken', () => {
  it('uses stable, distinct tokens for File objects with identical metadata', () => {
    const first = new File(['first'], 'document.pdf', { lastModified: 1 })
    const second = new File(['other'], 'document.pdf', { lastModified: 1 })

    expect(pdfFileToken(first)).toBe(pdfFileToken(first))
    expect(pdfFileToken(first)).not.toBe(pdfFileToken(second))
  })
})
