import type { PinExtensionOptions } from "./types"

// Must stay structurally assignable to `CanvasExtension` from
// `@h2-fe/pdf-viewer`, which this lib does not import (sibling feature).
export function createPinExtension(_options: PinExtensionOptions = {}) {
  return {}
}
