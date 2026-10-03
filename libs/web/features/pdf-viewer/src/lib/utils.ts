import { PDF_PAGE_GAP } from './consts'
import * as pdfjs from 'pdfjs-dist'
import workerSrc from 'pdfjs-dist/build/pdf.worker.mjs?url'
import { type Editor, type TLAssetId, type TLShapeId } from 'tldraw'
import { AssetRecordType } from 'tldraw'
import type { PdfDocumentSummary, RenderedPdfPage } from './types'

// pdfjs renders off the main thread; the worker URL is resolved by the bundler.
pdfjs.GlobalWorkerOptions.workerSrc = workerSrc

// Rasterise every page up front. The canvas keeps the result as a plain image,
// so panning and zooming never re-run this. pdfjs 6 takes the canvas element
// itself (`canvas` is required, `canvasContext` is now optional).
export async function renderPdf(data: ArrayBuffer, scale = 2): Promise<PdfDocumentSummary> {
  const loadingTask = pdfjs.getDocument({ data })
  const document = await loadingTask.promise
  const pages: RenderedPdfPage[] = []

  for (let pageNumber = 1; pageNumber <= document.numPages; pageNumber++) {
    const page = await document.getPage(pageNumber)
    const viewport = page.getViewport({ scale })
    const canvas = window.document.createElement('canvas')
    canvas.width = Math.ceil(viewport.width)
    canvas.height = Math.ceil(viewport.height)

    const canvasContext = canvas.getContext('2d')
    if (!canvasContext) throw new Error('Could not get a 2D context for the page')

    await page.render({ canvas, viewport, canvasContext }).promise

    pages.push({
      pageNumber,
      width: canvas.width,
      height: canvas.height,
      dataUrl: canvas.toDataURL('image/png')
    })
  }

  await loadingTask.destroy()
  return { pages }
}

// Every page becomes its own locked image shape, laid out one below the next
// with a gap. Locked because a page is the paper, not a thing you drag around.
// Idempotent by construction: stable page and asset ids, stale shapes deleted
// before new ones are created, so a retry refreshes the canvas in place rather
// than stacking a second copy of every page.
export function placePagesOnCanvas(editor: Editor, pages: RenderedPdfPage[]): void {
  if (pages.length === 0) return

  const shapeIds = pages.map(page => `shape:page-${page.pageNumber}` as TLShapeId)
  const assetIds = pages.map(page => `asset:page-${page.pageNumber}` as TLAssetId)
  editor.deleteShapes(shapeIds)
  editor.deleteAssets(assetIds)

  const assets = pages.map(page =>
    AssetRecordType.create({
      id: `asset:page-${page.pageNumber}` as TLAssetId,
      type: 'image',
      meta: {},
      props: {
        name: `page-${page.pageNumber}.png`,
        src: page.dataUrl,
        w: page.width,
        h: page.height,
        mimeType: 'image/png',
        isAnimated: false
      }
    })
  )

  editor.createAssets(assets)

  let y = 0
  const shapes = pages.map((page, index) => {
    const shape = {
      id: `shape:page-${page.pageNumber}` as TLShapeId,
      type: 'image' as const,
      x: 0,
      y,
      isLocked: true,
      props: {
        assetId: assets[index].id,
        w: page.width,
        h: page.height
      }
    }
    y += page.height + PDF_PAGE_GAP
    return shape
  })

  editor.createShapes(shapes)
  editor.zoomToFit({ animation: { duration: 200 } })
}
