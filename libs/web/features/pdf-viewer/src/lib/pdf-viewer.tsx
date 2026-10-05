import { useCallback, useEffect, useMemo, useRef, useState, type MouseEvent } from "react"
import { react, Tldraw, unsafe__withoutCapture, type BoxModel, type Editor } from "tldraw"
import "tldraw/tldraw.css"

import "./tldraw-theme.css"

import { Button, Heading, Spinner, Stack, Text, useColorMode } from "@h2-fe/ui"
import { ViewerTopBar } from "@h2-fe/web-ui"

import type { CanvasExtension, PageOverlay, PdfViewerScreenProps, RenderedPdfPage } from "./types"

import { CANVAS_THEME_CLASS } from "./consts"
import { createCanvasComponents } from "./partials/canvas-components"
import {
  PageOverlayCard,
  ViewerCanvas,
  ViewerCover,
  ViewerPanel,
  ViewerRoot
} from "./partials/viewer-chrome"
import {
  activePageNumber,
  hasUserMarks,
  keptPageNumbers,
  mergeCanvasExtensions,
  pageBounds,
  placePagesOnCanvas,
  sameOverlays,
  samePageNumbers,
  syncVisiblePages,
  visiblePageNumbers
} from "./utils"

const NO_EXTENSIONS: readonly CanvasExtension[] = []
const NO_BOXES: readonly BoxModel[] = []

export function PdfViewerScreen({
  filename,
  onMarksChange,
  document,
  isLoading,
  isError,
  onRetry,
  onOpenAnother,
  extensions = NO_EXTENSIONS,
  retainPageBounds
}: PdfViewerScreenProps) {
  const { colorMode } = useColorMode()
  const [initialColorScheme] = useState(colorMode)
  const [editor, setEditor] = useState<Editor | null>(null)
  const retainPageBoundsRef = useRef(retainPageBounds)
  useEffect(() => {
    retainPageBoundsRef.current = retainPageBounds
  }, [retainPageBounds])
  const merged = useMemo(() => mergeCanvasExtensions(extensions), [extensions])
  const components = useMemo(() => createCanvasComponents(merged), [merged])
  const handleMount = useCallback(
    (mountedEditor: Editor) => {
      mountedEditor.setColorMode(colorMode)
      setEditor(mountedEditor)
      const teardowns = merged.onMount.map((onMount) => onMount(mountedEditor))
      return () => {
        for (const teardown of teardowns) teardown?.()
      }
    },
    [colorMode, merged]
  )
  useEffect(() => {
    editor?.setColorMode(colorMode)
  }, [colorMode, editor])
  const [page, setPage] = useState(1)
  const [overlays, setOverlays] = useState<PageOverlay[]>([])
  const retryPage = useRef<(pageNumber: number) => void>(() => {})

  useEffect(() => {
    let stop: (() => void) | undefined
    if (editor && onMarksChange) {
      const updateMarks = () => onMarksChange(hasUserMarks(editor.getCurrentPageShapes()))
      stop = editor.store.listen(updateMarks, { scope: "document" })
      updateMarks()
    }
    return () => {
      stop?.()
    }
  }, [editor, onMarksChange])

  useEffect(() => {
    if (!editor || !document || document.pages.length === 0) return () => {}
    placePagesOnCanvas(editor, document.pages)

    let active = true
    const renderedPages = new Map<number, RenderedPdfPage>()
    const renderingPages = new Set<number>()
    const failedPages = new Set<number>()
    // What React and the store were last told; an update that would repeat
    // either is skipped, so panning within the same pages costs no commit.
    let visible: number[] = []
    let retained: readonly BoxModel[] = NO_BOXES
    let shownPage: number | undefined
    let shownOverlays: PageOverlay[] | undefined

    const requestRasters = () => {
      for (const pageNumber of visible) {
        if (
          renderedPages.has(pageNumber) ||
          renderingPages.has(pageNumber) ||
          failedPages.has(pageNumber)
        )
          continue
        renderingPages.add(pageNumber)
        void document
          .renderPages([pageNumber])
          .then((pages) => {
            if (!active) return
            const rendered = pages.filter((renderedPage) =>
              visible.includes(renderedPage.pageNumber)
            )
            for (const renderedPage of rendered) {
              renderedPages.set(renderedPage.pageNumber, renderedPage)
            }
            syncVisiblePages(editor, document.pages, visible, rendered)
          })
          .catch(() => {
            if (!active) return
            failedPages.add(pageNumber)
          })
          .finally(() => {
            renderingPages.delete(pageNumber)
            if (active) update(editor.getViewportPageBounds())
          })
      }
    }

    const update = (bounds: BoxModel) => {
      if (!active) return
      const onScreen = visiblePageNumbers(document.pages, bounds)
      const nextVisible = keptPageNumbers(document.pages, bounds, retained)
      if (!samePageNumbers(nextVisible, visible)) {
        visible = nextVisible
        for (const pageNumber of renderedPages.keys()) {
          if (!visible.includes(pageNumber)) renderedPages.delete(pageNumber)
        }
        syncVisiblePages(editor, document.pages, visible, [])
      }

      const nextPage = activePageNumber(document.pages, bounds)
      if (nextPage !== shownPage) {
        shownPage = nextPage
        setPage(nextPage)
      }

      requestRasters()

      const zoom = editor.getZoomLevel()
      const nextOverlays = onScreen.flatMap((pageNumber): PageOverlay[] => {
        if (!renderingPages.has(pageNumber) && !failedPages.has(pageNumber)) return []
        const pageBox = pageBounds(document.pages, pageNumber)
        if (!pageBox) return []
        const topLeft = editor.pageToViewport({ x: pageBox.x, y: pageBox.y })
        return [
          {
            page: pageNumber,
            state: failedPages.has(pageNumber) ? "error" : "loading",
            style: {
              left: topLeft.x,
              top: topLeft.y,
              width: pageBox.w * zoom,
              height: pageBox.h * zoom
            }
          }
        ]
      })
      if (!shownOverlays || !sameOverlays(nextOverlays, shownOverlays)) {
        shownOverlays = nextOverlays
        setOverlays(nextOverlays)
      }
    }

    retryPage.current = (pageNumber) => {
      failedPages.delete(pageNumber)
      update(editor.getViewportPageBounds())
    }
    // Tracks only the viewport (camera + screen bounds) and the retained
    // boxes, never the pointer. Store reads made while syncing pages must not
    // become dependencies.
    const stopReacting = react("pdf-viewer visible pages", () => {
      const bounds = editor.getViewportPageBounds()
      const nextRetained = retainPageBoundsRef.current?.(editor) ?? NO_BOXES
      unsafe__withoutCapture(() => {
        retained = nextRetained
        update(bounds)
      })
    })
    return () => {
      active = false
      retryPage.current = () => {}
      stopReacting()
      syncVisiblePages(editor, document.pages, [], [])
      renderedPages.clear()
    }
  }, [editor, document])

  const jumpToPage = useCallback(
    (pageNumber: number) => {
      if (!editor || !document) return
      const bounds = pageBounds(document.pages, pageNumber)
      if (bounds) editor.centerOnPoint({ x: bounds.x + bounds.w / 2, y: bounds.y + bounds.h / 2 })
    },
    [editor, document]
  )

  const handleRetryPage = useCallback((event: MouseEvent<HTMLButtonElement>) => {
    retryPage.current(Number(event.currentTarget.dataset.page))
  }, [])

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
          overlayUtils={merged.overlayUtils}
          overrides={merged.overrides}
          shapeUtils={merged.shapeUtils}
          tools={merged.tools}
        />

        {isLoading ? (
          <ViewerCover aria-label="Opening the document" as="output">
            <Spinner data-testid="viewer-loading" size="lg" />
          </ViewerCover>
        ) : isError ? (
          <ViewerCover>
            <ViewerPanel role="alert">
              <Stack gap="6">
                <Stack gap="2">
                  <Heading size="lg">The document didn't open</Heading>
                  <Text>The file may be unreadable or in an unsupported PDF dialect.</Text>
                </Stack>
                <Button variant="solid" w="full" onClick={onRetry}>
                  Try again
                </Button>
              </Stack>
            </ViewerPanel>
          </ViewerCover>
        ) : null}

        {overlays.map((overlay) => (
          <PageOverlayCard
            aria-label={`Page ${overlay.page} ${overlay.state === "error" ? "did not load" : "is loading"}`}
            css={{
              left: `${overlay.style.left}px`,
              top: `${overlay.style.top}px`,
              width: `${overlay.style.width}px`,
              height: `${overlay.style.height}px`
            }}
            key={overlay.page}
            role={overlay.state === "error" ? "alert" : "status"}
          >
            {overlay.state === "loading" ? (
              <Spinner aria-label={`Loading page ${overlay.page}`} />
            ) : (
              <Stack gap="2" pointerEvents="auto" textAlign="center">
                <Text>Page {overlay.page} couldn't load.</Text>
                <Button data-page={overlay.page} onClick={handleRetryPage} size="sm">
                  Retry page {overlay.page}
                </Button>
              </Stack>
            )}
          </PageOverlayCard>
        ))}
      </ViewerCanvas>
    </ViewerRoot>
  )
}
