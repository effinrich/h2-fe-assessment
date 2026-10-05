import type { TLComponents } from "tldraw"

import type { MergedCanvasExtensions } from "../types"

import { createViewerInFrontOfTheCanvas } from "./viewer-in-front-of-the-canvas"
import { createViewerKeyboardShortcutsDialog } from "./viewer-keyboard-shortcuts-dialog"
import { createViewerToolbar } from "./viewer-toolbar"

/**
 * tldraw slots for the merged extensions. Slots no extension needs stay
 * unset, so tldraw keeps its stock toolbar and dialogs.
 */
export function createCanvasComponents({
  toolIds,
  inFrontOfTheCanvas
}: Pick<MergedCanvasExtensions, "toolIds" | "inFrontOfTheCanvas">): TLComponents {
  const components: TLComponents = {}

  if (toolIds.length > 0) {
    components.Toolbar = createViewerToolbar(toolIds)
    components.KeyboardShortcutsDialog = createViewerKeyboardShortcutsDialog(toolIds)
  }

  if (inFrontOfTheCanvas.length > 0) {
    components.InFrontOfTheCanvas = createViewerInFrontOfTheCanvas(inFrontOfTheCanvas)
  }

  return components
}
