import type * as pdfjs from "pdfjs-dist"

import { act, fireEvent, screen, waitFor } from "@testing-library/react"
import { Profiler } from "react"
import { atom, DEFAULT_THEME } from "tldraw"
import { afterEach, describe, expect, it, vi } from "vitest"

import { UiProvider } from "@h2-fe/ui"

import type { RenderedPdfPage } from "./types"

import { PDF_PAGE_GAP } from "./consts"
import { pdfFileToken } from "./hooks"
import { PdfViewerScreen } from "./pdf-viewer"
import {
  createEditorStub,
  exampleDocument,
  page,
  page2,
  PAGE_RUN_OPTIONS,
  renderScreen
} from "./spec-helpers"
import { resetTldrawStub, tldrawStub } from "./tldraw-stub"

// jsdom cannot rasterise real PDFs, so PDF.js and tldraw are stubbed.
vi.mock("tldraw", async () => (await import("./tldraw-stub")).createTldrawStub())
vi.mock("pdfjs-dist", () => ({
  GlobalWorkerOptions: {},
  getDocument: vi.fn<typeof pdfjs.getDocument>()
}))

let finish: (pages: RenderedPdfPage[]) => void = () => {}

afterEach(() => {
  resetTldrawStub()
  vi.restoreAllMocks()
  vi.clearAllMocks()
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
    tldrawStub.editor = editor
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
    tldrawStub.editor = {
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
    tldrawStub.editor = {
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
    tldrawStub.editor = {
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
    tldrawStub.editor = {
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
    tldrawStub.editor = {
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
    tldrawStub.editor = {
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

  it("scopes the canvas to the app color mode", () => {
    const setColorMode = vi.fn<(mode: "dark" | "light") => unknown>()
    tldrawStub.editor = { setColorMode }
    renderScreen({ onOpenAnother: vi.fn<() => void>() })
    const root = document.querySelector("[data-canvas-theme]")
    expect(root).toBeTruthy()
    expect(root?.getAttribute("data-color-mode")).toBe("light")
    expect(setColorMode).toHaveBeenCalledWith("light")
    expect(tldrawStub.props?.hideUi).toBeUndefined()
  })

  it("draws shapes in their light colours in dark mode, because they sit on white pages", () => {
    renderScreen({ onOpenAnother: vi.fn<() => void>() })
    const { light, dark } = DEFAULT_THEME.colors
    const themed = tldrawStub.props?.themes?.default?.colors.dark
    expect(themed?.black).toEqual(light.black)
    expect(themed?.red).toEqual(light.red)
    expect(themed?.text).toBe(dark.text)
    expect(themed?.background).toBe(dark.background)
    expect(tldrawStub.props?.themes?.default?.colors.light).toEqual(light)
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
