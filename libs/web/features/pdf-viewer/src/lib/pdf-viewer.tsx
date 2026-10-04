import { useCallback, useEffect, useMemo, useRef, useState, type MouseEvent } from "react"
import { react, Tldraw, unsafe__withoutCapture, type Editor } from "tldraw"
import "tldraw/tldraw.css"

import { Box, Button, Flex, Heading, Spinner, Text } from "@h2-fe/ui"
import { ViewerTopBar } from "@h2-fe/web-ui"

import type { CanvasExtension, PageOverlay, PdfViewerScreenProps, RenderedPdfPage } from "./types"

import { createCanvasComponents } from "./partials/canvas-components"
import {
  activePageNumber,
  hasUserMarks,
  mergeCanvasExtensions,
  pageBounds,
  placePagesOnCanvas,
  sameOverlays,
  samePageNumbers,
  syncVisiblePages,
  visiblePageNumbers
} from "./utils"

const viewerStyle = { position: "absolute", inset: 0 } as const
const NO_EXTENSIONS: readonly CanvasExtension[] = []

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
  const [editor, setEditor] = useState<Editor | null>(null)
  const merged = useMemo(() => mergeCanvasExtensions(extensions), [extensions])
  const components = useMemo(() => createCanvasComponents(merged), [merged])
  const handleMount = useCallback(
    (mountedEditor: Editor) => {
      setEditor(mountedEditor)
      const teardowns = merged.onMount.map((onMount) => onMount(mountedEditor))
      return () => {
        for (const teardown of teardowns) teardown?.()
      }
    },
    [merged]
  )
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

    const update = (bounds: { x: number; y: number; w: number; h: number }) => {
      if (!active) return
      const nextVisible = visiblePageNumbers(document.pages, bounds)
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
      const nextOverlays = visible.flatMap((pageNumber): PageOverlay[] => {
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
    // Tracks only the viewport (camera + screen bounds), never the pointer.
    // Store reads made while syncing pages must not become dependencies.
    const stopReacting = react("pdf-viewer visible pages", () => {
      const bounds = editor.getViewportPageBounds()
      unsafe__withoutCapture(() => update(bounds))
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
    <div style={viewerStyle}>
      <Tldraw
        bindingUtils={merged.bindingUtils}
        components={components}
        onMount={handleMount}
        overlayUtils={merged.overlayUtils}
        overrides={merged.overrides}
        shapeUtils={merged.shapeUtils}
        tools={merged.tools}
      />

      {isLoading ? (
        <Flex
          align="center"
          aria-label="Opening the document"
          as="output"
          inset="0"
          justify="center"
          pointerEvents="auto"
          position="absolute"
        >
          <Spinner data-testid="viewer-loading" size="lg" />
        </Flex>
      ) : isError ? (
        <Flex align="center" inset="0" justify="center" pointerEvents="auto" position="absolute">
          <Box
            bg="bg.panel"
            borderColor="border"
            borderRadius="lg"
            borderWidth="1px"
            boxShadow="lg"
            color="fg"
            p="8"
            pointerEvents="auto"
            role="alert"
          >
            <Heading size="lg">The document didn't open</Heading>
            <Text marginTop="2">The file may be unreadable or in an unsupported PDF dialect.</Text>
            <Button marginTop="6" variant="solid" w="full" onClick={onRetry}>
              Try again
            </Button>
          </Box>
        </Flex>
      ) : null}

      {overlays.map((overlay) => (
        <Flex
          align="center"
          bg="bg.panel"
          justify="center"
          key={overlay.page}
          pointerEvents="none"
          aria-label={`Page ${overlay.page} ${overlay.state === "error" ? "did not load" : "is loading"}`}
          position="absolute"
          role={overlay.state === "error" ? "alert" : "status"}
          style={overlay.style}
        >
          {overlay.state === "loading" ? (
            <Spinner aria-label={`Loading page ${overlay.page}`} />
          ) : (
            <Box pointerEvents="auto" textAlign="center">
              <Text>Page {overlay.page} couldn't load.</Text>
              <Button data-page={overlay.page} onClick={handleRetryPage} size="sm">
                Retry page {overlay.page}
              </Button>
            </Box>
          )}
        </Flex>
      ))}

      <ViewerTopBar
        filename={filename}
        onOpenAnother={onOpenAnother}
        onPageChange={jumpToPage}
        page={page}
        totalPages={document?.pages.length ?? 0}
      />
    </div>
  )
}
