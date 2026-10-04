import type { Box, Editor } from "tldraw"

import type { CameraExtensionOptions } from "./types"

// Must stay structurally assignable to `CanvasExtension` from
// `@h2-fe/pdf-viewer`, which this lib does not import (sibling feature).
export function createCameraExtension(_options: CameraExtensionOptions = {}) {
  return {}
}

export function getCropFrameBounds(_editor: Editor): Box[] {
  return []
}
