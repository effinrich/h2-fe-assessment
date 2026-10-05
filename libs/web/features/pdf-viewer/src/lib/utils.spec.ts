import * as pdfjs from "pdfjs-dist"
import { afterEach, describe, expect, it, vi } from "vitest"

import type { PdfPage } from "./types"

import { PDF_PAGE_GAP } from "./consts"
import { createEditorStub, page, page2, PAGE_RUN_OPTIONS } from "./spec-helpers"
import {
  activePageNumber,
  hasUserMarks,
  isPdfPageShape,
  openPdf,
  pageBounds,
  placePagesOnCanvas,
  syncVisiblePages,
  visiblePageNumbers
} from "./utils"

// jsdom cannot rasterise real PDFs, so PDF.js and tldraw are stubbed.
vi.mock("tldraw", async () => (await import("./tldraw-stub")).createTldrawStub())
vi.mock("pdfjs-dist", () => ({
  GlobalWorkerOptions: {},
  getDocument: vi.fn<typeof pdfjs.getDocument>()
}))

afterEach(() => {
  vi.restoreAllMocks()
  vi.clearAllMocks()
  vi.mocked(pdfjs.getDocument).mockReset()
})

describe("placePagesOnCanvas", () => {
  it("starts with the first page so zoom-to-fit does not rasterise the full document", () => {
    const editorStub = createEditorStub()
    Reflect.apply(placePagesOnCanvas, undefined, [editorStub, [page, page2]])

    const shapes = editorStub.createShapes.mock.calls[0][0]
    expect(shapes).toHaveLength(1)
    expect(shapes[0]).toEqual({
      id: "shape:page-1",
      type: "image",
      x: 0,
      y: 0,
      isLocked: true,
      props: { assetId: "asset:page-1-pending", w: 100, h: 140 }
    })
    expect(editorStub.createAssets.mock.calls[0][0]).toEqual([
      expect.objectContaining({
        id: "asset:page-1-pending",
        props: expect.objectContaining({ src: null, w: 100, h: 140 })
      })
    ])
    expect(editorStub.zoomToFit).toHaveBeenCalledTimes(1)
  })

  it("lands each raster on a fresh asset and repoints the page shape", () => {
    const editorStub = createEditorStub()
    const pages = [page, page2]
    const shownAsset = () => {
      const assetId = editorStub.getShape("shape:page-1")?.props?.assetId
      return typeof assetId === "string" ? editorStub.getAsset(assetId) : undefined
    }
    Reflect.apply(placePagesOnCanvas, undefined, [editorStub, pages])

    const firstRaster = { ...page, dataUrl: "data:image/png;base64,first" }
    Reflect.apply(syncVisiblePages, undefined, [editorStub, pages, [1], [firstRaster]])
    const first = shownAsset()
    expect(first?.id).toMatch(/^asset:page-1-r\d+$/)
    expect(first?.props?.src).toBe(firstRaster.dataUrl)
    expect(editorStub.getAsset("asset:page-1-pending")).toBeUndefined()

    const secondRaster = { ...page, dataUrl: "data:image/png;base64,second" }
    Reflect.apply(syncVisiblePages, undefined, [editorStub, pages, [1], [secondRaster]])
    const second = shownAsset()
    expect(second?.id).toMatch(/^asset:page-1-r\d+$/)
    expect(second?.id).not.toBe(first?.id)
    expect(second?.props?.src).toBe(secondRaster.dataUrl)
    expect(editorStub.getAssets().map((asset) => asset.id)).toEqual([second?.id])

    expect(editorStub.updateAssets).not.toHaveBeenCalled()
    for (const [, options] of editorStub.run.mock.calls) expect(options).toEqual(PAGE_RUN_OPTIONS)
  })

  it("releases page shapes and assets when they leave the viewport", () => {
    const editorStub = createEditorStub()
    const pages = [page, page2]
    Reflect.apply(placePagesOnCanvas, undefined, [editorStub, pages])
    Reflect.apply(syncVisiblePages, undefined, [editorStub, pages, [1], [page]])

    Reflect.apply(syncVisiblePages, undefined, [editorStub, pages, [2], [page2]])
    expect(editorStub.getShape("shape:page-1")).toBeUndefined()
    expect(editorStub.getShape("shape:page-2")).toBeDefined()
    expect(editorStub.getAssets().map((asset) => asset.id)).toEqual([
      expect.stringMatching(/^asset:page-2-r\d+$/)
    ])

    Reflect.apply(syncVisiblePages, undefined, [editorStub, pages, [], []])
    expect(editorStub.getShape("shape:page-2")).toBeUndefined()
    expect(editorStub.getAssets()).toEqual([])
  })
})

describe("PDF page virtualization", () => {
  it("selects only pages intersecting the viewport", () => {
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

  it("destroys the loading task when opening a document fails", async () => {
    const loadingTask = {
      promise: Promise.reject(new Error("invalid PDF")),
      destroy: vi.fn<() => Promise<void>>(async () => {})
    }
    vi.mocked(pdfjs.getDocument).mockReturnValue(loadingTask as never)

    await expect(openPdf(new ArrayBuffer(0))).rejects.toThrow("invalid PDF")
    expect(loadingTask.destroy).toHaveBeenCalledTimes(1)
  })

  it("keeps the document alive so a failed visible page can retry", async () => {
    const renderError = new Error("render failed")
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
    vi.spyOn(HTMLCanvasElement.prototype, "getContext").mockReturnValue(
      {} as CanvasRenderingContext2D
    )

    const document = await openPdf(new ArrayBuffer(0))
    await expect(document.renderPages([1])).rejects.toThrow(renderError)
    expect(loadingTask.destroy).not.toHaveBeenCalled()
    await document.destroy()
    expect(loadingTask.destroy).toHaveBeenCalledTimes(1)
  })
})

describe("page workspace geometry", () => {
  const pages: PdfPage[] = [page, page2, { ...page, pageNumber: 3 }]

  it("positions pages with the same gap as canvas placement", () => {
    expect(pageBounds(pages, 2)).toEqual({ x: 0, y: 140 + PDF_PAGE_GAP, w: 100, h: 140 })
    expect(pageBounds(pages, 99)).toBeUndefined()
  })

  it("chooses the page with most visible overlap, including the gap", () => {
    expect(activePageNumber(pages, { x: 0, y: 140, w: 100, h: 100 })).toBe(2)
    expect(activePageNumber(pages, { x: 300, y: 0, w: 100, h: 140 })).toBe(1)
  })

  it("ignores PDF page shapes when checking for user marks", () => {
    expect(hasUserMarks([{ id: "shape:page-1" }])).toBe(false)
    expect(hasUserMarks([{ id: "shape:page-1" }, { id: "shape:mark-1" }])).toBe(true)
  })

  it("identifies PDF page shapes by their id pattern and image type", () => {
    expect(isPdfPageShape({ id: "shape:page-1", type: "image" })).toBe(true)
    expect(isPdfPageShape({ id: "shape:page-12", type: "image" })).toBe(true)
    expect(isPdfPageShape({ id: "shape:page-1", type: "geo" })).toBe(false)
    expect(isPdfPageShape({ id: "shape:mark-1", type: "image" })).toBe(false)
    expect(isPdfPageShape({ id: "shape:page-1a", type: "image" })).toBe(false)
    expect(isPdfPageShape({ id: "shape:page-", type: "image" })).toBe(false)
  })
})
