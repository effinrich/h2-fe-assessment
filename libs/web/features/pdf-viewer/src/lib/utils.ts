import * as pdfjs from "pdfjs-dist"
import workerSrc from "pdfjs-dist/build/pdf.worker.mjs?url"
import { type Editor, type TLAssetId, type TLShapeId } from "tldraw"
import { AssetRecordType } from "tldraw"

import type {
  CanvasExtension,
  MergedCanvasExtensions,
  PageOverlay,
  PdfDocumentSummary,
  PdfPage,
  RenderedPdfPage
} from "./types"

import { PDF_PAGE_GAP, PDF_PAGE_SHAPE_ID, VIEWER_OVERRIDES } from "./consts"

// pdfjs renders off the main thread; the worker URL is resolved by the bundler.
pdfjs.GlobalWorkerOptions.workerSrc = workerSrc

const PAGE_PLACEHOLDER = "data:image/gif;base64,R0lGODlhAQABAAD/ACwAAAAAAQABAAACADs="

export async function openPdf(data: ArrayBuffer, scale = 2): Promise<PdfDocumentSummary> {
  const loadingTask = pdfjs.getDocument({ data })
  let ownsLoadingTask = false

  try {
    const pdfDocument = await loadingTask.promise
    const pages: PdfPage[] = []

    for (let pageNumber = 1; pageNumber <= pdfDocument.numPages; pageNumber++) {
      const page = await pdfDocument.getPage(pageNumber)
      const viewport = page.getViewport({ scale })
      pages.push({
        pageNumber,
        width: Math.ceil(viewport.width),
        height: Math.ceil(viewport.height)
      })
    }

    let destroyed = false
    const destroy = async () => {
      if (destroyed) return
      destroyed = true
      await loadingTask.destroy()
    }

    ownsLoadingTask = true
    return {
      pages,
      renderPages: async (pageNumbers: number[]) => {
        return Promise.all(
          [...new Set(pageNumbers)].map(async (pageNumber) => {
            const page = await pdfDocument.getPage(pageNumber)
            const viewport = page.getViewport({ scale })
            const canvas = window.document.createElement("canvas")
            canvas.width = Math.ceil(viewport.width)
            canvas.height = Math.ceil(viewport.height)

            try {
              const canvasContext = canvas.getContext("2d")
              if (!canvasContext) throw new Error("Could not get a 2D context for the page")

              await page.render({ canvas, viewport, canvasContext }).promise

              return {
                pageNumber,
                width: canvas.width,
                height: canvas.height,
                dataUrl: canvas.toDataURL("image/png")
              }
            } finally {
              canvas.width = 0
              canvas.height = 0
            }
          })
        )
      },
      destroy
    }
  } finally {
    if (!ownsLoadingTask) await loadingTask.destroy()
  }
}

export function pageBounds(pages: PdfPage[], pageNumber: number) {
  let y = 0
  for (const page of pages) {
    if (page.pageNumber === pageNumber) return { x: 0, y, w: page.width, h: page.height }
    y += page.height + PDF_PAGE_GAP
  }
  return undefined
}

export function activePageNumber(
  pages: PdfPage[],
  bounds: { x: number; y: number; w: number; h: number }
): number {
  let active = pages[0]?.pageNumber ?? 1
  let largestOverlap = 0
  let y = 0
  for (const page of pages) {
    const overlapX = Math.max(0, Math.min(page.width, bounds.x + bounds.w) - Math.max(0, bounds.x))
    const overlapY = Math.max(
      0,
      Math.min(y + page.height, bounds.y + bounds.h) - Math.max(y, bounds.y)
    )
    const overlap = overlapX * overlapY
    if (overlap > largestOverlap) {
      largestOverlap = overlap
      active = page.pageNumber
    }
    y += page.height + PDF_PAGE_GAP
  }
  return active
}

export function hasUserMarks(shapes: ReadonlyArray<{ id: string }>): boolean {
  return shapes.some((shape) => !PDF_PAGE_SHAPE_ID.test(shape.id))
}

export function isPdfPageShape(shape: { id: string; type: string }): boolean {
  return shape.type === "image" && PDF_PAGE_SHAPE_ID.test(shape.id)
}

export function mergeCanvasExtensions(
  extensions: readonly CanvasExtension[]
): MergedCanvasExtensions {
  return {
    toolIds: extensions.flatMap((extension) => extension.toolIds ?? []),
    shapeUtils: extensions.flatMap((extension) => extension.shapeUtils ?? []),
    bindingUtils: extensions.flatMap((extension) => extension.bindingUtils ?? []),
    tools: extensions.flatMap((extension) => extension.tools ?? []),
    overlayUtils: extensions.flatMap((extension) => extension.overlayUtils ?? []),
    overrides: [
      ...extensions.flatMap((extension) => (extension.overrides ? [extension.overrides] : [])),
      VIEWER_OVERRIDES
    ],
    inFrontOfTheCanvas: extensions.flatMap((extension) =>
      extension.InFrontOfTheCanvas ? [extension.InFrontOfTheCanvas] : []
    ),
    onMount: extensions.flatMap((extension) => (extension.onMount ? [extension.onMount] : []))
  }
}

export function visiblePageNumbers(
  pages: PdfPage[],
  bounds: { x: number; y: number; w: number; h: number }
): number[] {
  const visible: number[] = []
  let y = 0

  for (const page of pages) {
    const intersects =
      bounds.x < page.width &&
      bounds.x + bounds.w > 0 &&
      bounds.y < y + page.height &&
      bounds.y + bounds.h > y
    if (intersects) visible.push(page.pageNumber)
    y += page.height + PDF_PAGE_GAP
  }

  return visible
}

export function samePageNumbers(a: readonly number[], b: readonly number[]): boolean {
  return a.length === b.length && a.every((pageNumber, index) => pageNumber === b[index])
}

export function sameOverlays(a: readonly PageOverlay[], b: readonly PageOverlay[]): boolean {
  return (
    a.length === b.length &&
    a.every((overlay, index) => {
      const other = b[index]
      return (
        overlay.page === other.page &&
        overlay.state === other.state &&
        overlay.style.left === other.style.left &&
        overlay.style.top === other.style.top &&
        overlay.style.width === other.style.width &&
        overlay.style.height === other.style.height
      )
    })
  )
}

export function placePagesOnCanvas(editor: Editor, pages: PdfPage[]): void {
  if (pages.length === 0) return

  syncVisiblePages(editor, pages, [pages[0].pageNumber], [])
  editor.zoomToFit({ animation: { duration: 200 } })
}

export function syncVisiblePages(
  editor: Editor,
  pages: PdfPage[],
  visiblePageNumbers: number[],
  renderedPages: RenderedPdfPage[]
): void {
  const visible = new Set(visiblePageNumbers)
  const offscreenPages = pages.filter((page) => !visible.has(page.pageNumber))
  const offscreenShapeIds = offscreenPages
    .map((page) => `shape:page-${page.pageNumber}` as TLShapeId)
    .filter((id) => editor.getShape(id))
  const offscreenAssetIds = offscreenPages
    .map((page) => `asset:page-${page.pageNumber}` as TLAssetId)
    .filter((id) => editor.getAsset(id))

  editor.run(
    () => {
      if (offscreenShapeIds.length) editor.deleteShapes(offscreenShapeIds)
      if (offscreenAssetIds.length) editor.deleteAssets(offscreenAssetIds)

      const renderedByPage = new Map(renderedPages.map((page) => [page.pageNumber, page]))
      let y = 0

      for (const page of pages) {
        if (visible.has(page.pageNumber)) {
          const assetId = `asset:page-${page.pageNumber}` as TLAssetId
          const shapeId = `shape:page-${page.pageNumber}` as TLShapeId
          const existingAsset = editor.getAsset(assetId)
          const renderedPage = renderedByPage.get(page.pageNumber)

          if (!existingAsset || renderedPage) {
            const asset = AssetRecordType.create({
              id: assetId,
              type: "image",
              meta: {},
              props: {
                name: `page-${page.pageNumber}.png`,
                src: renderedPage?.dataUrl ?? PAGE_PLACEHOLDER,
                w: page.width,
                h: page.height,
                mimeType: "image/png",
                isAnimated: false
              }
            })
            if (existingAsset) editor.updateAssets([asset])
            else editor.createAssets([asset])
          }

          if (!editor.getShape(shapeId)) {
            editor.createShapes([
              {
                id: shapeId,
                type: "image",
                x: 0,
                y,
                isLocked: true,
                props: { assetId, w: page.width, h: page.height }
              }
            ])
          }
        }
        y += page.height + PDF_PAGE_GAP
      }
    },
    { history: "ignore" }
  )
}
