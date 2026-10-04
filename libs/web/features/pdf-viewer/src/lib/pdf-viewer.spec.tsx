import { act, fireEvent, render, screen, waitFor } from '@testing-library/react'
import { useEffect } from 'react'
import { UiProvider } from '@h2-fe/ui'
import { afterEach, describe, expect, it, vi } from 'vitest'
import type { Editor } from 'tldraw'
import * as pdfjs from 'pdfjs-dist'
import { PDF_PAGE_GAP } from './consts'
import { PdfViewerScreen } from './pdf-viewer'
import {
  activePageNumber,
  hasUserMarks,
  openPdf,
  pageBounds,
  placePagesOnCanvas,
  syncVisiblePages,
  visiblePageNumbers
} from './utils'
import { pdfFileToken } from './hooks'
import type { PdfPage, PdfViewerScreenProps, RenderedPdfPage } from './types'

// jsdom cannot rasterise real PDFs, so PDF.js and tldraw are stubbed. These
// tests cover the screen states, file identity, viewport selection, cleanup,
// and canvas placement.
vi.mock('tldraw', () => ({
  AssetRecordType: { create: (input: Record<string, unknown>) => input },
  Tldraw: ({ onMount }: { onMount?: (editor: Editor) => void }) => {
    useEffect(() => {
      if (onMount && mountedEditor) onMount(mountedEditor)
    }, [onMount])
    return <div data-testid="tldraw" />
  }
}))

let mountedEditor: Editor | null = null

vi.mock('pdfjs-dist', () => ({
  GlobalWorkerOptions: {},
  getDocument: vi.fn<typeof pdfjs.getDocument>()
}))

const page: RenderedPdfPage = { pageNumber: 1, width: 100, height: 140, dataUrl: '' }
const page2: RenderedPdfPage = { pageNumber: 2, width: 100, height: 140, dataUrl: '' }
const exampleDocument = {
  pages: [page],
  renderPages: vi.fn<() => Promise<RenderedPdfPage[]>>(async () => [page]),
  destroy: vi.fn<() => Promise<void>>(async () => {})
}

function createEditorStub() {
  const assets = new Map<string, object>()
  const shapes = new Map<string, object>()
  return {
    createAssets: vi.fn<(items: { id: string }[]) => void>(items =>
      items.forEach(asset => assets.set(asset.id, asset))
    ),
    createShapes: vi.fn<(items: { id: string }[]) => void>(items =>
      items.forEach(shape => shapes.set(shape.id, shape))
    ),
    deleteAssets: vi.fn<(ids: string[]) => void>(ids => ids.forEach(id => assets.delete(id))),
    deleteShapes: vi.fn<(ids: string[]) => void>(ids => ids.forEach(id => shapes.delete(id))),
    updateAssets: vi.fn<(items: { id: string }[]) => void>(items =>
      items.forEach(asset => assets.set(asset.id, asset))
    ),
    getAsset: vi.fn<(id: string) => object | undefined>(id => assets.get(id)),
    getShape: vi.fn<(id: string) => object | undefined>(id => shapes.get(id)),
    zoomToFit: vi.fn<(opts?: unknown) => void>(),
    run: vi.fn<(callback: () => void, options: { history: string }) => void>(callback => callback())
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
  mountedEditor = null
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

  it('tracks page position, jumps without rasterising all pages, and preserves marks', async () => {
    const stub = createEditorStub()
    let bounds = { x: 0, y: 0, w: 100, h: 140 }
    let notify = () => {}
    const editor = {
      ...stub,
      getViewportPageBounds: () => bounds,
      getZoomLevel: () => 1,
      pageToViewport: (point: { x: number; y: number }) => point,
      getCurrentPageShapes: () => [{ id: 'shape:page-1' }, { id: 'shape:mark-1' }],
      centerOnPoint: (point: { x: number; y: number }) => {
        bounds = { ...bounds, y: point.y - 70 }
        notify()
      },
      store: {
        listen: (callback: () => void) => {
          notify = callback
          return () => {}
        }
      }
    }
    mountedEditor = editor as unknown as Editor
    const onMarksChange = vi.fn<(hasMarks: boolean) => void>()
    const renderPages = vi.fn<(numbers: number[]) => Promise<RenderedPdfPage[]>>(async numbers =>
      numbers.map(number => (number === 1 ? page : page2))
    )
    renderScreen({
      document: { pages: [page, page2], renderPages, destroy: async () => {} },
      filename: 'example.pdf',
      onMarksChange,
      onOpenAnother: vi.fn<() => void>()
    })
    await waitFor(() => expect(renderPages).toHaveBeenCalledWith([1]))
    expect(onMarksChange).toHaveBeenCalledWith(true)
    fireEvent.click(screen.getByRole('button', { name: 'Next page' }))
    await waitFor(() =>
      expect(screen.getByRole('spinbutton', { name: 'Page number' }).getAttribute('value')).toBe(
        '2'
      )
    )
    await waitFor(() => expect(renderPages).toHaveBeenCalledWith([2]))
    expect(stub.deleteShapes).toHaveBeenCalledWith(['shape:page-1'])
    expect(stub.run).toHaveBeenCalledWith(expect.any(Function), { history: 'ignore' })
    expect(stub.deleteShapes).not.toHaveBeenCalledWith(['shape:mark-1'])
  })

  it('shows a page-sized loading indicator until its raster completes', async () => {
    const stub = createEditorStub()
    mountedEditor = {
      ...stub,
      getViewportPageBounds: () => ({ x: 0, y: 0, w: 100, h: 140 }),
      getZoomLevel: () => 1,
      pageToViewport: (point: { x: number; y: number }) => point,
      store: { listen: () => () => {} }
    } as unknown as Editor
    let finish: (pages: RenderedPdfPage[]) => void = () => {}
    const renderPages = vi.fn<(numbers: number[]) => Promise<RenderedPdfPage[]>>(
      () =>
        new Promise(resolve => {
          finish = resolve
        })
    )
    renderScreen({
      document: { pages: [page], renderPages, destroy: async () => {} },
      onOpenAnother: vi.fn<() => void>()
    })
    await waitFor(() => expect(screen.getByLabelText('Loading page 1')).toBeTruthy())
    await act(async () => {
      finish([page])
    })
    await waitFor(() => expect(screen.queryByLabelText('Loading page 1')).toBeNull())
  })

  it('retries a failed page without reopening the document', async () => {
    const stub = createEditorStub()
    let notify = () => {}
    mountedEditor = {
      ...stub,
      getViewportPageBounds: () => ({ x: 0, y: 0, w: 100, h: 140 }),
      getZoomLevel: () => 1,
      pageToViewport: (point: { x: number; y: number }) => point,
      store: {
        listen: (callback: () => void) => {
          notify = callback
          return () => {}
        }
      }
    } as unknown as Editor
    const renderPages = vi
      .fn<(numbers: number[]) => Promise<RenderedPdfPage[]>>()
      .mockRejectedValueOnce(new Error('render failed'))
      .mockResolvedValueOnce([page])
    renderScreen({
      document: { pages: [page], renderPages, destroy: async () => {} },
      onOpenAnother: vi.fn<() => void>()
    })
    await waitFor(() => expect(screen.getByRole('button', { name: 'Retry page 1' })).toBeTruthy())
    fireEvent.click(screen.getByRole('button', { name: 'Retry page 1' }))
    await waitFor(() => expect(renderPages).toHaveBeenCalledTimes(2))
    act(notify)
    await waitFor(() => expect(screen.queryByRole('button', { name: 'Retry page 1' })).toBeNull())
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
      destroy: vi.fn<() => Promise<void>>(async () => {})
    }
    vi.mocked(pdfjs.getDocument).mockReturnValue(loadingTask as never)

    await expect(openPdf(new ArrayBuffer(0))).rejects.toThrow('invalid PDF')
    expect(loadingTask.destroy).toHaveBeenCalledTimes(1)
  })

  it('keeps the document alive so a failed visible page can retry', async () => {
    const renderError = new Error('render failed')
    const pdfPage = {
      getViewport: () => ({ width: 100, height: 140 }),
      render: () => ({ promise: Promise.reject(renderError) })
    }
    const loadingTask = {
      promise: Promise.resolve({
        numPages: 1,
        getPage: vi.fn<() => Promise<typeof pdfPage>>(async () => pdfPage)
      }),
      destroy: vi.fn<() => Promise<void>>(async () => {})
    }
    vi.mocked(pdfjs.getDocument).mockReturnValue(loadingTask as never)
    vi.spyOn(HTMLCanvasElement.prototype, 'getContext').mockReturnValue(
      {} as CanvasRenderingContext2D
    )

    const document = await openPdf(new ArrayBuffer(0))
    await expect(document.renderPages([1])).rejects.toThrow(renderError)
    expect(loadingTask.destroy).not.toHaveBeenCalled()
    await document.destroy()
    expect(loadingTask.destroy).toHaveBeenCalledTimes(1)
  })
})

describe('page workspace geometry', () => {
  const pages: PdfPage[] = [page, page2, { ...page, pageNumber: 3 }]

  it('positions pages with the same gap as canvas placement', () => {
    expect(pageBounds(pages, 2)).toEqual({ x: 0, y: 140 + PDF_PAGE_GAP, w: 100, h: 140 })
    expect(pageBounds(pages, 99)).toBeUndefined()
  })

  it('chooses the page with most visible overlap, including the gap', () => {
    expect(activePageNumber(pages, { x: 0, y: 140, w: 100, h: 100 })).toBe(2)
    expect(activePageNumber(pages, { x: 300, y: 0, w: 100, h: 140 })).toBe(1)
  })

  it('ignores PDF page shapes when checking for user marks', () => {
    expect(hasUserMarks([{ id: 'shape:page-1' }])).toBe(false)
    expect(hasUserMarks([{ id: 'shape:page-1' }, { id: 'shape:mark-1' }])).toBe(true)
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
