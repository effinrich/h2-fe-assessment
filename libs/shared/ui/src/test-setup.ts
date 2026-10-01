import { vi } from 'vitest';

// jsdom has no matchMedia, and next-themes reads it on mount.
Object.defineProperty(window, 'matchMedia', {
  writable: true,
  value: vi.fn().mockImplementation((query: string) => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: vi.fn(),
    removeListener: vi.fn(),
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
    dispatchEvent: vi.fn(),
  })),
});

// jsdom has no ResizeObserver or Element.scrollTo; Zag's positioning and listbox scrolling call both.
// The stubs are deliberately empty: there is nothing to observe in jsdom.
/* eslint-disable @typescript-eslint/no-empty-function */
globalThis.ResizeObserver ??= class {
  observe() {}
  unobserve() {}
  disconnect() {}
};
Element.prototype.scrollTo ??= function scrollTo() {};
/* eslint-enable @typescript-eslint/no-empty-function */
