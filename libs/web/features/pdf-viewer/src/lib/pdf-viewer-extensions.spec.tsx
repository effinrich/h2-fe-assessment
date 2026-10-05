import type * as pdfjs from "pdfjs-dist"
import type * as TldrawModule from "tldraw"

import { Profiler } from "react"
import { afterEach, describe, expect, it, vi } from "vitest"

import { UiProvider } from "@h2-fe/ui"

import type { CanvasExtension } from "./types"

import { PdfViewerScreen } from "./pdf-viewer"
import { renderScreen } from "./spec-helpers"
import { resetTldrawStub, tldrawStub } from "./tldraw-stub"

// jsdom cannot rasterise real PDFs, so PDF.js and tldraw are stubbed.
vi.mock("tldraw", async () => (await import("./tldraw-stub")).createTldrawStub())
vi.mock("pdfjs-dist", () => ({
  GlobalWorkerOptions: {},
  getDocument: vi.fn<typeof pdfjs.getDocument>()
}))

afterEach(() => {
  resetTldrawStub()
  vi.restoreAllMocks()
  vi.clearAllMocks()
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
    tldrawStub.editor = { setColorMode: vi.fn<(mode: "dark" | "light") => unknown>() }
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

    const props = tldrawStub.props
    expect(props?.shapeUtils).toEqual([shapeA, shapeB])
    expect(props?.bindingUtils).toEqual([bindingA])
    expect(props?.tools).toEqual([toolA, toolB])
    expect(props?.overlayUtils).toEqual([overlayA])
    expect(props?.overrides).toEqual(expect.arrayContaining([overridesA, overridesB]))
    expect(props?.components?.Toolbar).toBeTypeOf("function")
    expect(props?.components?.KeyboardShortcutsDialog).toBeTypeOf("function")
    expect(props?.components?.InFrontOfTheCanvas).toBeTypeOf("function")
    expect(onMountA).toHaveBeenCalledWith(tldrawStub.editor)
    expect(onMountB).toHaveBeenCalledWith(tldrawStub.editor)

    unmount()
    expect(teardownA).toHaveBeenCalledTimes(1)
  })

  it("keeps tldraw's stock toolbar and dialogs when no extension adds a tool", () => {
    renderScreen({
      extensions: [{ shapeUtils: [shapeA] }],
      onOpenAnother: vi.fn<() => void>()
    })

    expect(tldrawStub.props?.shapeUtils).toEqual([shapeA])
    expect(tldrawStub.props?.components?.Toolbar).toBeUndefined()
    expect(tldrawStub.props?.components?.KeyboardShortcutsDialog).toBeUndefined()
    expect(tldrawStub.props?.components?.InFrontOfTheCanvas).toBeUndefined()
  })

  it("keeps merged contributions referentially stable across re-renders", () => {
    const extensions: CanvasExtension[] = [
      { toolIds: ["tool-a"], shapeUtils: [shapeA], tools: [toolA] }
    ]
    const onOpenAnother = vi.fn<() => void>()
    const { rerender } = renderScreen({ extensions, filename: "a.pdf", onOpenAnother })
    const first = tldrawStub.props
    expect(first?.shapeUtils).toEqual([shapeA])

    rerender(
      <UiProvider>
        <Profiler id="pdf-viewer" onRender={() => {}}>
          <PdfViewerScreen extensions={extensions} filename="b.pdf" onOpenAnother={onOpenAnother} />
        </Profiler>
      </UiProvider>
    )

    expect(tldrawStub.props).not.toBe(first)
    expect(tldrawStub.props?.shapeUtils).toBe(first?.shapeUtils)
    expect(tldrawStub.props?.tools).toBe(first?.tools)
    expect(tldrawStub.props?.overrides).toBe(first?.overrides)
    expect(tldrawStub.props?.components).toBe(first?.components)
  })
})
