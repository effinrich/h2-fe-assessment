import { useMemo } from "react"
import { Tldraw, type TLComponents } from "tldraw"

import { Box } from "@h2-fe/ui"
import "tldraw/tldraw.css"

import type { PinExtension } from "./types"

import { PinStoryShortcutsDialog } from "./pin-story-shortcuts-dialog"
import { PinStoryToolbar } from "./pin-story-toolbar"

/**
 * A plain `<Tldraw>` carrying the pin extension, with the toolbar and
 * shortcuts-dialog slots the viewer renders for extension tools (ADR 0011
 * amendment: extension stories mount their own canvas).
 */
export function PinStoryCanvas({ extension }: { extension: PinExtension }) {
  const components = useMemo<TLComponents>(
    () => ({
      Toolbar: PinStoryToolbar,
      KeyboardShortcutsDialog: PinStoryShortcutsDialog,
      InFrontOfTheCanvas: extension.InFrontOfTheCanvas
    }),
    [extension.InFrontOfTheCanvas]
  )
  return (
    <Box position="fixed" inset="0">
      <Tldraw
        shapeUtils={extension.shapeUtils}
        bindingUtils={extension.bindingUtils}
        tools={extension.tools}
        overlayUtils={extension.overlayUtils}
        overrides={extension.overrides}
        components={components}
        onMount={extension.onMount}
      />
    </Box>
  )
}
