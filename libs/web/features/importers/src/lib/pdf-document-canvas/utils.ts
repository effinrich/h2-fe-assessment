import * as pdfjs from 'pdfjs-dist'
import workerSrc from 'pdfjs-dist/build/pdf.worker.mjs?url'

// pdfjs renders off the main thread; the worker URL is resolved by the bundler.
pdfjs.GlobalWorkerOptions.workerSrc = workerSrc

export interface RenderedPdfPage {
  pageNumber: number
  width: number
  height: number
  dataUrl: string
}

export interface PdfDocumentSummary {
  pageCount: number
  pages: RenderedPdfPage[]
}

// Rasterise every page up front. The canvas keeps the result as a plain image,
// so panning and zooming never re-run this. pdfjs 6 takes the canvas element
// itself (`canvas` is required, `canvasContext` is now optional).
export async function renderPdf(
  data: ArrayBuffer,
  scale = 2,
): Promise<PdfDocumentSummary> {
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
      dataUrl: canvas.toDataURL('image/png'),
    })
  }

  const pageCount = document.numPages
  await loadingTask.destroy()
  return { pageCount, pages }
}
