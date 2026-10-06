import { useMemo, useState } from "react"
import { DEFAULT_THEME, Tldraw } from "tldraw"
import "tldraw/tldraw.css"

import "./tldraw-theme.css"

import { useColorMode } from "@h2-fe/ui"

import type { CanvasExtension, PdfViewerScreenProps } from "./types"

import { CANVAS_THEME_CLASS } from "./consts"
import { useCanvasEditor, useMarksChange, usePageNavigation } from "./hooks"
import { createCanvasComponents } from "./partials/canvas-components"
import { ViewerCanvas, ViewerRoot } from "./partials/viewer-chrome"
import { ViewerStatus } from "./partials/viewer-status"
import { mergeCanvasExtensions, paperTheme } from "./utils"
import { ViewerTopBar } from "./viewer-top-bar/viewer-top-bar"

const NO_EXTENSIONS: readonly CanvasExtension[] = []
const THEMES = { default: paperTheme(DEFAULT_THEME) }

export function PdfViewerScreen({
  filename,
  onMarksChange,
  document,
  isLoading,
  isError,
  onRetry,
  onOpenAnother,
  extensions = NO_EXTENSIONS
}: PdfViewerScreenProps) {
  const { colorMode } = useColorMode()
  const [initialColorScheme] = useState(colorMode)
  const merged = useMemo(() => mergeCanvasExtensions(extensions), [extensions])
  const components = useMemo(() => createCanvasComponents(merged), [merged])
  const { editor, handleMount } = useCanvasEditor(colorMode)
  useMarksChange(editor, onMarksChange)
  const { page, jumpToPage } = usePageNavigation(editor, document)

  return (
    <ViewerRoot className={CANVAS_THEME_CLASS} data-canvas-theme="" data-color-mode={colorMode}>
      <ViewerTopBar
        filename={filename}
        onOpenAnother={onOpenAnother}
        onPageChange={jumpToPage}
        page={page}
        totalPages={document?.pages.length ?? 0}
      />
      <ViewerCanvas>
        <Tldraw
          bindingUtils={merged.bindingUtils}
          colorScheme={initialColorScheme}
          components={components}
          onMount={handleMount}
          overrides={merged.overrides}
          shapeUtils={merged.shapeUtils}
          themes={THEMES}
          tools={merged.tools}
        />
        <ViewerStatus isError={isError} isLoading={isLoading} onRetry={onRetry} />
      </ViewerCanvas>
    </ViewerRoot>
  )
}
