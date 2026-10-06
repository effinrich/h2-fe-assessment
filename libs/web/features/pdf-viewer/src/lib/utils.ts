import * as pdfjs from "pdfjs-dist"
import workerSrc from "pdfjs-dist/build/pdf.worker.mjs?url"
import {
  type BoxModel,
  type Editor,
  type TLAssetId,
  type TLImageShape,
  type TLShapeId,
  type TLTheme
} from "tldraw"
import { AssetRecordType } from "tldraw"

import type {
  CanvasExtension,
  MergedCanvasExtensions,
  PageOverlay,
  PdfDocumentSummary,
  PdfPage,
  RenderedPdfPage
} from "./types"

import {
  FIT_INSET_SHARE,
  PDF_PAGE_ASSET_ID,
  PDF_PAGE_GAP,
  PDF_PAGE_SHAPE_ID,
  VIEWER_OVERRIDES
} from "./consts"

// pdfjs renders off the main thread; the worker URL is resolved by the bundler.
pdfjs.GlobalWorkerOptions.workerSrc = workerSrc

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

/**
 * `theme` with dark mode's shape colours (the `TLDefaultColor` entries) taken
 * from light mode. Marks sit on white pages, where the dark palette's "black"
 * is near-white; dark UI colours stay.
 */
export function paperTheme(theme: TLTheme): TLTheme {
  const { light, dark } = theme.colors
  const shapeColors = Object.fromEntries(
    Object.entries(light).filter(([, value]) => typeof value === "object")
  )
  // Semi fills draw in `solid`; pattern fills and label outlines in `negativeSpace`.
  const fills = { solid: light.solid, negativeSpace: light.negativeSpace }
  return { ...theme, colors: { light, dark: { ...dark, ...shapeColors, ...fills } } }
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

export function keptPageNumbers(
  pages: PdfPage[],
  viewport: BoxModel,
  retained: readonly BoxModel[]
): number[] {
  if (retained.length === 0) return visiblePageNumbers(pages, viewport)
  const kept = new Set(visiblePageNumbers(pages, viewport))
  for (const box of retained) {
    for (const pageNumber of visiblePageNumbers(pages, box)) kept.add(pageNumber)
  }
  return pages.map((page) => page.pageNumber).filter((pageNumber) => kept.has(pageNumber))
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

/** Viewport-space cards over the on-screen pages that are still rendering or failed. */
export function pageOverlays(
  editor: Editor,
  pages: PdfPage[],
  onScreen: readonly number[],
  renderingPages: ReadonlySet<number>,
  failedPages: ReadonlySet<number>
): PageOverlay[] {
  const zoom = editor.getZoomLevel()
  return onScreen.flatMap((pageNumber): PageOverlay[] => {
    if (!renderingPages.has(pageNumber) && !failedPages.has(pageNumber)) return []
    const pageBox = pageBounds(pages, pageNumber)
    if (!pageBox) return []
    const topLeft = editor.pageToViewport({ x: pageBox.x, y: pageBox.y })
    return [
      {
        page: pageNumber,
        state: failedPages.has(pageNumber) ? "error" : "loading",
        style: {
          left: topLeft.x,
          top: topLeft.y,
          width: pageBox.w * zoom,
          height: pageBox.h * zoom
        }
      }
    ]
  })
}

export function placePagesOnCanvas(editor: Editor, pages: PdfPage[]): void {
  if (pages.length === 0) return

  const first = pages[0]
  syncVisiblePages(editor, pages, [first.pageNumber], [])
  editor.zoomToBounds(
    { x: 0, y: 0, w: first.width, h: first.height },
    {
      inset: editor.getViewportScreenBounds().w * FIT_INSET_SHARE,
      animation: { duration: 200 }
    }
  )
}

let rasterSequence = 0

function pageAsset(id: TLAssetId, page: PdfPage, src: string | null) {
  return AssetRecordType.create({
    id,
    type: "image",
    meta: {},
    props: {
      name: `page-${page.pageNumber}.png`,
      src,
      w: page.width,
      h: page.height,
      mimeType: "image/png",
      isAnimated: false
    }
  })
}

function assetIdsByPage(editor: Editor): Map<number, TLAssetId[]> {
  const byPage = new Map<number, TLAssetId[]>()
  for (const asset of editor.getAssets()) {
    const match = PDF_PAGE_ASSET_ID.exec(asset.id)
    if (!match) continue
    const pageNumber = Number(match[1])
    byPage.set(pageNumber, [...(byPage.get(pageNumber) ?? []), asset.id])
  }
  return byPage
}

export function syncVisiblePages(
  editor: Editor,
  pages: PdfPage[],
  visiblePageNumbers: number[],
  renderedPages: RenderedPdfPage[]
): void {
  const visible = new Set(visiblePageNumbers)
  const renderedByPage = new Map(renderedPages.map((page) => [page.pageNumber, page]))
  const pageAssetIds = assetIdsByPage(editor)
  const evictedShapeIds: TLShapeId[] = []
  const staleAssetIds: TLAssetId[] = []

  editor.run(
    () => {
      let y = 0
      for (const page of pages) {
        const shapeId = `shape:page-${page.pageNumber}` as TLShapeId
        const shape = editor.getShape<TLImageShape>(shapeId)
        const assetIds = pageAssetIds.get(page.pageNumber) ?? []

        if (!visible.has(page.pageNumber)) {
          if (shape) evictedShapeIds.push(shapeId)
          staleAssetIds.push(...assetIds)
        } else {
          const shownAssetId = shape?.props.assetId
          const rendered = renderedByPage.get(page.pageNumber)
          let assetId: TLAssetId
          if (rendered) {
            // tldraw shows a src change on a shown asset only after ~32 frames; a new id shows at once.
            assetId = `asset:page-${page.pageNumber}-r${++rasterSequence}` as TLAssetId
            editor.createAssets([pageAsset(assetId, page, rendered.dataUrl)])
          } else if (shownAssetId && editor.getAsset(shownAssetId)) {
            assetId = shownAssetId
          } else {
            assetId = `asset:page-${page.pageNumber}-pending` as TLAssetId
            if (!editor.getAsset(assetId)) editor.createAssets([pageAsset(assetId, page, null)])
          }

          if (!shape) {
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
          } else if (shownAssetId !== assetId) {
            editor.updateShapes<TLImageShape>([{ id: shapeId, type: "image", props: { assetId } }])
          }
          staleAssetIds.push(...assetIds.filter((id) => id !== assetId))
        }
        y += page.height + PDF_PAGE_GAP
      }

      if (evictedShapeIds.length) editor.deleteShapes(evictedShapeIds)
      if (staleAssetIds.length) editor.deleteAssets(staleAssetIds)
    },
    // Page shapes are locked; tldraw silently skips locked shapes in updateShapes and deleteShapes.
    { history: "ignore", ignoreShapeLock: true }
  )
}
