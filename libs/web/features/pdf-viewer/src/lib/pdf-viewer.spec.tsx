import type * as TldrawModule from "tldraw"

import { act, fireEvent, render, screen, waitFor } from "@testing-library/react"
import * as pdfjs from "pdfjs-dist"
import { Profiler, useEffect } from "react"
import { atom } from "tldraw"
import { afterEach, describe, expect, it, vi } from "vitest"

import { UiProvider } from "@h2-fe/ui"

import type { CanvasExtension, PdfPage, PdfViewerScreenProps, RenderedPdfPage } from "./types"

import { PDF_PAGE_GAP } from "./consts"
import { pdfFileToken } from "./hooks"
import { PdfViewerScreen } from "./pdf-viewer"
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

// jsdom cannot rasterise real PDFs, so PDF.js and tldraw are stubbed. These
// tests cover the screen states, file identity, viewport selection, cleanup,
// and canvas placement. tldraw's signals stay real so reactive viewport code
// is exercised as it runs in the app.
vi.mock("tldraw", async () => {
  const {
    atom: realAtom,
    react,
    unsafe__withoutCapture
  } = await vi.importActual<typeof TldrawModule>("tldraw")
  return {
    atom: realAtom,
    react,
    unsafe__withoutCapture,
    AssetRecordType: { create: (input: Record<string, unknown>) => input },
    Tldraw: (props: TldrawModule.TldrawProps) => {
      tldraw.props = props
      // Like tldraw: the latest onMount runs once per mount.
      useEffect(() => {
        if (!mountedEditor) return undefined
        return tldraw.props?.onMount?.(mountedEditor as TldrawModule.Editor) ?? undefined
      }, [])
      return <div data-testid="tldraw" />
    }
  }
})

const tldraw = vi.hoisted(() => ({ props: null as TldrawModule.TldrawProps | null }))
let mountedEditor: object | null = null
let finish: (pages: RenderedPdfPage[]) => void = () => {}

vi.mock("pdfjs-dist", () => ({
  GlobalWorkerOptions: {},
  getDocument: vi.fn<typeof pdfjs.getDocument>()
}))

const page: RenderedPdfPage = { pageNumber: 1, width: 100, height: 140, dataUrl: "" }
const page2: RenderedPdfPage = { pageNumber: 2, width: 100, height: 140, dataUrl: "" }
const exampleDocument = {
  pages: [page],
  renderPages: vi.fn<() => Promise<RenderedPdfPage[]>>(async () => [page]),
  destroy: vi.fn<() => Promise<void>>(async () => {})
}

type StubRecord = { id: string; isLocked?: boolean; props?: Record<string, unknown> }
type RunOptions = { history?: string; ignoreShapeLock?: boolean }

function createEditorStub() {
  const assets = new Map<string, StubRecord>()
  const shapes = new Map<string, StubRecord>()
  // Like tldraw's Editor: updateShapes and deleteShapes skip locked shapes
  // unless an enclosing run ignores the shape lock.
  let ignoreShapeLock = false
  const isWritable = (id: string) => ignoreShapeLock || !shapes.get(id)?.isLocked
  return {
    createAssets: vi.fn<(items: StubRecord[]) => void>((items) =>
      items.forEach((asset) => assets.set(asset.id, asset))
    ),
    createShapes: vi.fn<(items: StubRecord[]) => void>((items) =>
      items.forEach((shape) => shapes.set(shape.id, shape))
    ),
    deleteAssets: vi.fn<(ids: string[]) => void>((ids) => ids.forEach((id) => assets.delete(id))),
    deleteShapes: vi.fn<(ids: string[]) => void>((ids) =>
      ids.filter(isWritable).forEach((id) => shapes.delete(id))
    ),
    updateAssets: vi.fn<(items: StubRecord[]) => void>((items) =>
      items.forEach((asset) => assets.set(asset.id, asset))
    ),
    updateShapes: vi.fn<(items: StubRecord[]) => void>((items) =>
      items
        .filter((item) => isWritable(item.id))
        .forEach((item) => {
          const shape = shapes.get(item.id)
          if (shape)
            shapes.set(item.id, { ...shape, ...item, props: { ...shape.props, ...item.props } })
        })
    ),
    getAsset: vi.fn<(id: string) => StubRecord | undefined>((id) => assets.get(id)),
    getAssets: vi.fn<() => StubRecord[]>(() => [...assets.values()]),
    getShape: vi.fn<(id: string) => StubRecord | undefined>((id) => shapes.get(id)),
    zoomToFit: vi.fn<(opts?: unknown) => void>(),
    run: vi.fn<(callback: () => void, options?: RunOptions) => void>((callback, options) => {
      const previous = ignoreShapeLock
      ignoreShapeLock = options?.ignoreShapeLock ?? previous
      try {
        callback()
      } finally {
        ignoreShapeLock = previous
      }
    })
  }
}

const PAGE_RUN_OPTIONS: RunOptions = { history: "ignore", ignoreShapeLock: true }

function renderScreen(props: PdfViewerScreenProps, onRender: () => void = () => {}) {
  return render(
    <UiProvider>
      <Profiler id="pdf-viewer" onRender={onRender}>
        <PdfViewerScreen {...props} />
      </Profiler>
    </UiProvider>
  )
}

afterEach(() => {
  mountedEditor = null
  tldraw.props = null
  vi.restoreAllMocks()
  vi.clearAllMocks()
  vi.mocked(pdfjs.getDocument).mockReset()
})

describe("PdfViewerScreen", () => {
  it("mounts the canvas surface", () => {
    renderScreen({ onOpenAnother: vi.fn<() => void>() })
    expect(screen.getByTestId("tldraw")).toBeTruthy()
  })

  it("shows the loading state while the document rasterises", () => {
    renderScreen({ isLoading: true, onOpenAnother: vi.fn<() => void>() })
    expect(screen.getByTestId("viewer-loading")).toBeTruthy()
  })

  it("shows the error surface with a working retry", () => {
    const onRetry = vi.fn<() => void>()
    renderScreen({ isError: true, onRetry, onOpenAnother: vi.fn<() => void>() })
    expect(screen.getByRole("alert")).toBeTruthy()
    fireEvent.click(screen.getByRole("button", { name: /try again/i }))
    expect(onRetry).toHaveBeenCalledTimes(1)
  })

  it("tracks page position, jumps without rasterising all pages, and preserves marks", async () => {
    const stub = createEditorStub()
    const viewport = atom("viewport", { x: 0, y: 0, w: 100, h: 140 })
    const editor = {
      ...stub,
      getViewportPageBounds: () => viewport.get(),
      getZoomLevel: () => 1,
      pageToViewport: (point: { x: number; y: number }) => point,
      getCurrentPageShapes: () => [{ id: "shape:page-1" }, { id: "shape:mark-1" }],
      centerOnPoint: (point: { x: number; y: number }) => {
        viewport.set({ ...viewport.get(), y: point.y - 70 })
      },
      store: { listen: () => () => {} }
    }
    mountedEditor = editor
    const onMarksChange = vi.fn<(hasMarks: boolean) => void>()
    const renderPages = vi.fn<(numbers: number[]) => Promise<RenderedPdfPage[]>>(async (numbers) =>
      numbers.map((number) => (number === 1 ? page : page2))
    )
    // A mark the user drew, to prove page virtualisation leaves it alone.
    stub.createShapes([{ id: "shape:mark-1" }])
    renderScreen({
      document: { pages: [page, page2], renderPages, destroy: async () => {} },
      filename: "example.pdf",
      onMarksChange,
      onOpenAnother: vi.fn<() => void>()
    })
    await waitFor(() => expect(renderPages).toHaveBeenCalledWith([1]))
    expect(onMarksChange).toHaveBeenCalledWith(true)
    fireEvent.click(screen.getByRole("button", { name: "Next page" }))
    await waitFor(() =>
      expect(screen.getByRole("spinbutton", { name: "Page number" }).getAttribute("value")).toBe(
        "2"
      )
    )
    await waitFor(() => expect(renderPages).toHaveBeenCalledWith([2]))
    expect(stub.getShape("shape:page-1")).toBeUndefined()
    expect(stub.run).toHaveBeenCalledWith(expect.any(Function), PAGE_RUN_OPTIONS)
    expect(stub.getShape("shape:mark-1")).toBeDefined()
  })

  it("replaces page shapes and assets when the document changes", async () => {
    const stub = createEditorStub()
    mountedEditor = {
      ...stub,
      getViewportPageBounds: () => ({ x: 0, y: 0, w: 300, h: 300 }),
      getZoomLevel: () => 1,
      pageToViewport: (point: { x: number; y: number }) => point,
      store: { listen: () => () => {} }
    }
    const wide: RenderedPdfPage = { pageNumber: 1, width: 300, height: 150, dataUrl: "" }
    const first = { pages: [page], renderPages: async () => [page], destroy: async () => {} }
    const second = { pages: [wide], renderPages: async () => [wide], destroy: async () => {} }
    const onOpenAnother = vi.fn<() => void>()
    const { rerender, unmount } = renderScreen({ document: first, onOpenAnother })
    await waitFor(() => expect(stub.getShape("shape:page-1")?.props?.w).toBe(100))

    rerender(
      <UiProvider>
        <Profiler id="pdf-viewer" onRender={() => {}}>
          <PdfViewerScreen document={second} onOpenAnother={onOpenAnother} />
        </Profiler>
      </UiProvider>
    )
    await waitFor(() => expect(stub.getShape("shape:page-1")?.props?.w).toBe(300))
    expect(stub.getAssets().map((asset) => asset.props?.w)).toEqual([300])

    unmount()
    expect(stub.getShape("shape:page-1")).toBeUndefined()
    expect(stub.getAssets()).toEqual([])
  })

  it("shows a page-sized loading indicator until its raster completes", async () => {
    const stub = createEditorStub()
    mountedEditor = {
      ...stub,
      getViewportPageBounds: () => ({ x: 0, y: 0, w: 100, h: 140 }),
      getZoomLevel: () => 1,
      pageToViewport: (point: { x: number; y: number }) => point,
      store: { listen: () => () => {} }
    }
    const renderPages = vi.fn<(numbers: number[]) => Promise<RenderedPdfPage[]>>(
      () =>
        new Promise((resolve) => {
          finish = resolve
        })
    )
    renderScreen({
      document: { pages: [page], renderPages, destroy: async () => {} },
      onOpenAnother: vi.fn<() => void>()
    })
    await waitFor(() => expect(screen.getByLabelText("Loading page 1")).toBeTruthy())
    await act(async () => {
      finish([page])
    })
    await waitFor(() => expect(screen.queryByLabelText("Loading page 1")).toBeNull())
  })

  it("retries a failed page without reopening the document", async () => {
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
    }
    const renderPages = vi
      .fn<(numbers: number[]) => Promise<RenderedPdfPage[]>>()
      .mockRejectedValueOnce(new Error("render failed"))
      .mockResolvedValueOnce([page])
    renderScreen({
      document: { pages: [page], renderPages, destroy: async () => {} },
      onOpenAnother: vi.fn<() => void>()
    })
    await waitFor(() => expect(screen.getByRole("button", { name: "Retry page 1" })).toBeTruthy())
    fireEvent.click(screen.getByRole("button", { name: "Retry page 1" }))
    await waitFor(() => expect(renderPages).toHaveBeenCalledTimes(2))
    act(notify)
    await waitFor(() => expect(screen.queryByRole("button", { name: "Retry page 1" })).toBeNull())
  })

  it("does not re-render or touch the store when the viewport moves within the same pages", async () => {
    const stub = createEditorStub()
    const viewport = atom("viewport", { x: 0, y: 0, w: 100, h: 140 })
    // tldraw's camera and pointer records are both session-scoped, so a
    // session listener hears every pointer move as well as every pan.
    const sessionListeners = new Set<() => void>()
    const emitSessionChange = () => sessionListeners.forEach((listener) => listener())
    const moveCamera = (next: { x: number; y: number; w: number; h: number }) => {
      viewport.set(next)
      emitSessionChange()
    }
    mountedEditor = {
      ...stub,
      getViewportPageBounds: () => viewport.get(),
      getZoomLevel: () => 1,
      pageToViewport: (point: { x: number; y: number }) => point,
      store: {
        listen: (callback: () => void, filters?: { scope?: string }) => {
          if (filters?.scope !== "session") return () => {}
          sessionListeners.add(callback)
          return () => sessionListeners.delete(callback)
        }
      }
    }
    const renderPages = vi.fn<(numbers: number[]) => Promise<RenderedPdfPage[]>>(async (numbers) =>
      numbers.map((number) => (number === 1 ? page : page2))
    )
    const onRender = vi.fn<() => void>()
    renderScreen(
      {
        document: { pages: [page, page2], renderPages, destroy: async () => {} },
        onOpenAnother: vi.fn<() => void>()
      },
      onRender
    )
    await waitFor(() => expect(renderPages).toHaveBeenCalledWith([1]))
    await waitFor(() => expect(screen.queryByLabelText("Loading page 1")).toBeNull())

    const commits = onRender.mock.calls.length
    const transactions = stub.run.mock.calls.length
    await act(async () => {
      emitSessionChange()
      emitSessionChange()
      moveCamera({ x: 5, y: 10, w: 100, h: 120 })
      emitSessionChange()
    })

    expect(onRender).toHaveBeenCalledTimes(commits)
    expect(stub.run).toHaveBeenCalledTimes(transactions)
    expect(renderPages).toHaveBeenCalledTimes(1)

    await act(async () => {
      moveCamera({ x: 0, y: page.height + PDF_PAGE_GAP, w: 100, h: 140 })
    })
    await waitFor(() => expect(renderPages).toHaveBeenCalledWith([2]))
    expect(stub.run.mock.calls.length).toBeGreaterThan(transactions)
    expect(screen.getByRole("spinbutton", { name: "Page number" }).getAttribute("value")).toBe("2")
  })

  it("keeps pages under a retained box after they leave the viewport, until the box goes", async () => {
    const stub = createEditorStub()
    const viewport = atom("viewport", { x: 0, y: 0, w: 100, h: 140 })
    const retained = atom<{ x: number; y: number; w: number; h: number }[]>("retained", [])
    mountedEditor = {
      ...stub,
      getViewportPageBounds: () => viewport.get(),
      getZoomLevel: () => 1,
      pageToViewport: (point: { x: number; y: number }) => point,
      store: { listen: () => () => {} }
    }
    const renderPages = vi.fn<(numbers: number[]) => Promise<RenderedPdfPage[]>>(async (numbers) =>
      numbers.map((number) => (number === 1 ? page : page2))
    )
    renderScreen({
      document: { pages: [page, page2], renderPages, destroy: async () => {} },
      retainPageBounds: () => retained.get(),
      onOpenAnother: vi.fn<() => void>()
    })
    await waitFor(() => expect(renderPages).toHaveBeenCalledWith([1]))

    await act(async () => {
      retained.set([{ x: 10, y: 10, w: 50, h: 50 }])
      viewport.set({ x: 0, y: page.height + PDF_PAGE_GAP, w: 100, h: 140 })
    })
    await waitFor(() => expect(renderPages).toHaveBeenCalledWith([2]))
    expect(stub.getShape("shape:page-1")).toBeDefined()
    expect(stub.getShape("shape:page-2")).toBeDefined()
    expect(screen.getByRole("spinbutton", { name: "Page number" }).getAttribute("value")).toBe("2")

    await act(async () => {
      retained.set([])
    })
    expect(stub.getShape("shape:page-1")).toBeUndefined()
    expect(stub.getShape("shape:page-2")).toBeDefined()
    expect(stub.getAssets().map((asset) => asset.id)).toEqual([
      expect.stringMatching(/^asset:page-2-/)
    ])
  })

  it("rasterises a retained page that is outside the viewport", async () => {
    const stub = createEditorStub()
    mountedEditor = {
      ...stub,
      getViewportPageBounds: () => ({ x: 0, y: 0, w: 100, h: 140 }),
      getZoomLevel: () => 1,
      pageToViewport: (point: { x: number; y: number }) => point,
      store: { listen: () => () => {} }
    }
    const renderPages = vi.fn<(numbers: number[]) => Promise<RenderedPdfPage[]>>(async (numbers) =>
      numbers.map((number) => (number === 1 ? page : page2))
    )
    renderScreen({
      document: { pages: [page, page2], renderPages, destroy: async () => {} },
      retainPageBounds: () => [{ x: 10, y: page.height + PDF_PAGE_GAP + 10, w: 50, h: 50 }],
      onOpenAnother: vi.fn<() => void>()
    })

    await waitFor(() => expect(renderPages).toHaveBeenCalledWith([2]))
    expect(stub.getShape("shape:page-2")).toBeDefined()
    expect(screen.getByRole("spinbutton", { name: "Page number" }).getAttribute("value")).toBe("1")
  })

  it("offers Open another document when a document is on the canvas", () => {
    const onOpenAnother = vi.fn<() => void>()
    renderScreen({ document: exampleDocument, onOpenAnother })
    fireEvent.click(screen.getByRole("button", { name: /open another document/i }))
    expect(onOpenAnother).toHaveBeenCalledTimes(1)
  })
})

describe("canvas extensions", () => {
  // tldraw is stubbed, so utils are identity tokens: the screen only forwards them.
  const shapeA = { type: "shape-a" } as unknown as TldrawModule.TLAnyShapeUtilConstructor
  const shapeB = { type: "shape-b" } as unknown as TldrawModule.TLAnyShapeUtilConstructor
  const bindingA = { type: "binding-a" } as unknown as TldrawModule.TLAnyBindingUtilConstructor
  const overlayA = { type: "overlay-a" } as unknown as TldrawModule.TLAnyOverlayUtilConstructor
  const toolA = { id: "tool-a" } as unknown as TldrawModule.TLStateNodeConstructor
  const toolB = { id: "tool-b" } as unknown as TldrawModule.TLStateNodeConstructor
  const overridesA: TldrawModule.TLUiOverrides = { translations: { en: { "tool.a": "A" } } }
  const overridesB: TldrawModule.TLUiOverrides = { translations: { en: { "tool.b": "B" } } }

  it("passes every extension's contributions to the editor, in order", () => {
    mountedEditor = {}
    const teardownA = vi.fn<() => void>()
    const onMountA = vi.fn<TldrawModule.TLOnMountHandler>(() => teardownA)
    const onMountB = vi.fn<TldrawModule.TLOnMountHandler>()
    const extensions: CanvasExtension[] = [
      {
        toolIds: ["tool-a"],
        shapeUtils: [shapeA],
        bindingUtils: [bindingA],
        tools: [toolA],
        overlayUtils: [overlayA],
        overrides: overridesA,
        InFrontOfTheCanvas: () => null,
        onMount: onMountA
      },
      {
        toolIds: ["tool-b"],
        shapeUtils: [shapeB],
        tools: [toolB],
        overrides: overridesB,
        onMount: onMountB
      }
    ]

    const { unmount } = renderScreen({ extensions, onOpenAnother: vi.fn<() => void>() })

    const props = tldraw.props
    expect(props?.shapeUtils).toEqual([shapeA, shapeB])
    expect(props?.bindingUtils).toEqual([bindingA])
    expect(props?.tools).toEqual([toolA, toolB])
    expect(props?.overlayUtils).toEqual([overlayA])
    expect(props?.overrides).toEqual(expect.arrayContaining([overridesA, overridesB]))
    expect(props?.components?.Toolbar).toBeTypeOf("function")
    expect(props?.components?.KeyboardShortcutsDialog).toBeTypeOf("function")
    expect(props?.components?.InFrontOfTheCanvas).toBeTypeOf("function")
    expect(onMountA).toHaveBeenCalledWith(mountedEditor)
    expect(onMountB).toHaveBeenCalledWith(mountedEditor)

    unmount()
    expect(teardownA).toHaveBeenCalledTimes(1)
  })

  it("keeps tldraw's stock toolbar and dialogs when no extension adds a tool", () => {
    renderScreen({
      extensions: [{ shapeUtils: [shapeA] }],
      onOpenAnother: vi.fn<() => void>()
    })

    expect(tldraw.props?.shapeUtils).toEqual([shapeA])
    expect(tldraw.props?.components?.Toolbar).toBeUndefined()
    expect(tldraw.props?.components?.KeyboardShortcutsDialog).toBeUndefined()
    expect(tldraw.props?.components?.InFrontOfTheCanvas).toBeUndefined()
  })

  it("keeps merged contributions referentially stable across re-renders", () => {
    const extensions: CanvasExtension[] = [
      { toolIds: ["tool-a"], shapeUtils: [shapeA], tools: [toolA] }
    ]
    const onOpenAnother = vi.fn<() => void>()
    const { rerender } = renderScreen({ extensions, filename: "a.pdf", onOpenAnother })
    const first = tldraw.props
    expect(first?.shapeUtils).toEqual([shapeA])

    rerender(
      <UiProvider>
        <Profiler id="pdf-viewer" onRender={() => {}}>
          <PdfViewerScreen extensions={extensions} filename="b.pdf" onOpenAnother={onOpenAnother} />
        </Profiler>
      </UiProvider>
    )

    expect(tldraw.props).not.toBe(first)
    expect(tldraw.props?.shapeUtils).toBe(first?.shapeUtils)
    expect(tldraw.props?.tools).toBe(first?.tools)
    expect(tldraw.props?.overrides).toBe(first?.overrides)
    expect(tldraw.props?.components).toBe(first?.components)
  })
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

describe("pdfFileToken", () => {
  it("uses stable, distinct tokens for File objects with identical metadata", () => {
    const first = new File(["first"], "document.pdf", { lastModified: 1 })
    const second = new File(["other"], "document.pdf", { lastModified: 1 })

    expect(pdfFileToken(first)).toBe(pdfFileToken(first))
    expect(pdfFileToken(first)).not.toBe(pdfFileToken(second))
  })
})
