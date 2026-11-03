import { AssetRecordType, createShapeId, type Editor, type TLTheme } from "tldraw"

import type { CanvasExtension, MergedCanvasExtensions, PdfPage } from "./types"

import { FIT_INSET_SHARE, PDF_PAGE_GAP, PDF_PAGE_SHAPE_ID, VIEWER_OVERRIDES } from "./consts"

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
    overrides: [
      ...extensions.flatMap((extension) => (extension.overrides ? [extension.overrides] : [])),
      VIEWER_OVERRIDES
    ],
    inFrontOfTheCanvas: extensions.flatMap((extension) =>
      extension.InFrontOfTheCanvas ? [extension.InFrontOfTheCanvas] : []
    ),
    nonDocumentShapeTypes: extensions.flatMap((extension) => extension.nonDocumentShapeTypes ?? [])
  }
}

/**
 * Stacks every page down the canvas as a locked image shape and fits the
 * first one. Returns a function that removes them again.
 */
export function placePages(editor: Editor, pages: PdfPage[]): () => void {
  let y = 0
  const placed = pages.map((page) => {
    const assetId = AssetRecordType.createId(`page-${page.pageNumber}`)
    const shapeId = createShapeId(`page-${page.pageNumber}`)
    const asset = AssetRecordType.create({
      id: assetId,
      type: "image",
      meta: {},
      props: {
        name: `page-${page.pageNumber}.png`,
        src: page.src,
        w: page.width,
        h: page.height,
        mimeType: "image/png",
        isAnimated: false
      }
    })
    const shape = {
      id: shapeId,
      type: "image" as const,
      x: 0,
      y,
      isLocked: true,
      props: { assetId, w: page.width, h: page.height }
    }
    y += page.height + PDF_PAGE_GAP
    return { asset, shape }
  })

  // Page shapes are locked; tldraw silently skips locked shapes in deleteShapes.
  const options = { history: "ignore", ignoreShapeLock: true } as const
  editor.run(() => {
    editor.createAssets(placed.map(({ asset }) => asset))
    editor.createShapes(placed.map(({ shape }) => shape))
  }, options)

  const [first] = pages
  if (first) {
    editor.zoomToBounds(
      { x: 0, y: 0, w: first.width, h: first.height },
      { inset: editor.getViewportScreenBounds().w * FIT_INSET_SHARE, animation: { duration: 200 } }
    )
  }

  return () =>
    editor.run(() => {
      editor.deleteShapes(placed.map(({ shape }) => shape.id))
      editor.deleteAssets(placed.map(({ asset }) => asset.id))
    }, options)
}
