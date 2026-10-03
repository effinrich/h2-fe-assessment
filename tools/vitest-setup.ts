import { vi } from "vitest";

// jsdom has no matchMedia, and next-themes (inside UiProvider) reads it on mount.
Object.defineProperty(window, "matchMedia", {
  writable: true,
  value: (query: string) => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: vi.fn(),
    removeListener: vi.fn(),
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
    dispatchEvent: vi.fn(),
  }),
});

// jsdom has no ResizeObserver or Element.scrollTo; Zag's positioning calls both.
class ResizeObserverStub {
  observe = vi.fn();
  unobserve = vi.fn();
  disconnect = vi.fn();
}
globalThis.ResizeObserver ??= ResizeObserverStub as unknown as typeof ResizeObserver;

// tldraw's asset loader calls image.decode() on mount; jsdom ships no decode.
if ("decode" in HTMLImageElement.prototype === false) {
  (HTMLImageElement.prototype as unknown as { decode: () => Promise<void> }).decode =
    () => Promise.resolve();
}

// tldraw's FontManager iterates document.fonts and constructs FontFace
// instances; jsdom ships neither the collection nor the class.
class FontFaceStub {
  family: string;
  constructor(family: string) {
    this.family = family;
  }
  load(): Promise<FontFaceStub> {
    return Promise.resolve(this);
  }
}
globalThis.FontFace ??= FontFaceStub as unknown as typeof FontFace;
document.fonts ??= {
  add: () => {},
  delete: () => {},
  has: () => false,
  clear: () => {},
  forEach: () => {},
  [Symbol.iterator]: function* () {},
} as unknown as FontFaceSet;



if (!Element.prototype.scrollTo) {
  Element.prototype.scrollTo = vi.fn() as unknown as typeof Element.prototype.scrollTo;
}
