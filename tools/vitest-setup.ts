import { vi } from "vitest"

// jsdom has no matchMedia, and next-themes (inside UiProvider) reads it on mount.
Object.defineProperty(window, "matchMedia", {
  writable: true,
  value: (query: string) => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: vi.fn<(...args: Parameters<MediaQueryList["addListener"]>) => void>(),
    removeListener: vi.fn<(...args: Parameters<MediaQueryList["removeListener"]>) => void>(),
    addEventListener: vi.fn<(...args: Parameters<MediaQueryList["addEventListener"]>) => void>(),
    removeEventListener:
      vi.fn<(...args: Parameters<MediaQueryList["removeEventListener"]>) => void>(),
    dispatchEvent: vi.fn<(...args: Parameters<MediaQueryList["dispatchEvent"]>) => void>()
  })
})

// jsdom has no ResizeObserver or Element.scrollTo; Zag's positioning calls both.
class ResizeObserverStub {
  observe = vi.fn<(target: Element, options?: ResizeObserverOptions) => void>(
    (_target, _options) => {}
  )
  unobserve = vi.fn<(target: Element) => void>((_target) => {})
  disconnect = vi.fn()
  takeRecords = vi.fn((): ResizeObserverEntry[] => [])
}
globalThis.ResizeObserver ??= ResizeObserverStub

// tldraw's asset loader calls image.decode() on mount; jsdom ships no decode.
if (!("decode" in HTMLImageElement.prototype)) {
  Object.defineProperty(HTMLImageElement.prototype, "decode", {
    value: () => Promise.resolve()
  })
}

// tldraw's FontManager iterates document.fonts and constructs FontFace
// instances; jsdom ships neither the collection nor the class.
class FontFaceStub {
  family: string
  constructor(family: string) {
    this.family = family
  }
  load(): Promise<FontFaceStub> {
    return Promise.resolve(this)
  }
}
if (!globalThis.FontFace) {
  Object.defineProperty(globalThis, "FontFace", {
    configurable: true,
    value: FontFaceStub
  })
}
if (!document.fonts) {
  Object.defineProperty(document, "fonts", {
    configurable: true,
    value: {
      add: () => {},
      delete: () => {},
      has: () => false,
      clear: () => {},
      forEach: () => {},
      [Symbol.iterator]: function* () {}
    }
  })
}

if (!Element.prototype.scrollTo) {
  Object.defineProperty(Element.prototype, "scrollTo", {
    value: vi.fn(),
    writable: true
  })
}
