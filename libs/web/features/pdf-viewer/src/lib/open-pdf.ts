import type { PDFPageProxy } from "pdfjs-dist"

import * as pdfjs from "pdfjs-dist"
import workerSrc from "pdfjs-dist/build/pdf.worker.mjs?url"

import type { PdfDocument, PdfPage } from "./types"

// pdfjs renders off the main thread; the worker URL is resolved by the bundler.
pdfjs.GlobalWorkerOptions.workerSrc = workerSrc

async function renderPage(page: PDFPageProxy, scale: number): Promise<PdfPage> {
  const viewport = page.getViewport({ scale })
  const canvas = window.document.createElement("canvas")
  canvas.width = Math.ceil(viewport.width)
  canvas.height = Math.ceil(viewport.height)
  try {
    const canvasContext = canvas.getContext("2d")
    if (!canvasContext) throw new Error("Could not get a 2D context for the page")
    await page.render({ canvas, viewport, canvasContext }).promise
    return {
      pageNumber: page.pageNumber,
      width: canvas.width,
      height: canvas.height,
      src: canvas.toDataURL("image/png")
    }
  } finally {
    canvas.width = 0
    canvas.height = 0
  }
}

/** Rasterises every page up front, as tldraw's PDF editor example does. */
export async function openPdf(data: ArrayBuffer, scale = 2): Promise<PdfDocument> {
  const loadingTask = pdfjs.getDocument({ data })
  try {
    const pdfDocument = await loadingTask.promise
    const pages: PdfPage[] = []
    for (let pageNumber = 1; pageNumber <= pdfDocument.numPages; pageNumber++) {
      pages.push(await renderPage(await pdfDocument.getPage(pageNumber), scale))
    }
    return { pages, scale }
  } finally {
    await loadingTask.destroy()
  }
}
