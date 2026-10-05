import { render } from "@testing-library/react"
import { Profiler } from "react"
import { vi } from "vitest"

import { UiProvider } from "@h2-fe/ui"

import type { PdfViewerScreenProps, RenderedPdfPage } from "./types"

import { PdfViewerScreen } from "./pdf-viewer"

export const page: RenderedPdfPage = { pageNumber: 1, width: 100, height: 140, dataUrl: "" }
export const page2: RenderedPdfPage = { pageNumber: 2, width: 100, height: 140, dataUrl: "" }
export const exampleDocument = {
  pages: [page],
  renderPages: vi.fn<() => Promise<RenderedPdfPage[]>>(async () => [page]),
  destroy: vi.fn<() => Promise<void>>(async () => {})
}

export type StubRecord = { id: string; isLocked?: boolean; props?: Record<string, unknown> }
export type RunOptions = { history?: string; ignoreShapeLock?: boolean }

export function createEditorStub() {
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
    setColorMode: vi.fn<(mode: "dark" | "light") => unknown>(),
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

export const PAGE_RUN_OPTIONS: RunOptions = { history: "ignore", ignoreShapeLock: true }

export function renderScreen(props: PdfViewerScreenProps, onRender: () => void = () => {}) {
  return render(
    <UiProvider>
      <Profiler id="pdf-viewer" onRender={onRender}>
        <PdfViewerScreen {...props} />
      </Profiler>
    </UiProvider>
  )
}
