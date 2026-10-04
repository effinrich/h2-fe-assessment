import { useEffect, useRef, useState } from 'react'
import { Tldraw, type Editor } from 'tldraw'
import 'tldraw/tldraw.css'
import { Box, Button, Flex, Heading, Spinner, Text } from '@h2-fe/ui'
import { ViewerTopBar } from '@h2-fe/web-ui'
import {
  activePageNumber,
  hasUserMarks,
  pageBounds,
  placePagesOnCanvas,
  syncVisiblePages,
  visiblePageNumbers
} from './utils'
import type { PdfViewerScreenProps, RenderedPdfPage } from './types'

type PageState = 'loading' | 'error'
type PageOverlay = { page: number; state: PageState; x: number; y: number; w: number; h: number }

export function PdfViewerScreen({
  filename,
  onMarksChange,
  document,
  isLoading,
  isError,
  onRetry,
  onOpenAnother
}: PdfViewerScreenProps) {
  const [editor, setEditor] = useState<Editor | null>(null)
  const [page, setPage] = useState(1)
  const [overlays, setOverlays] = useState<PageOverlay[]>([])
  const retryPage = useRef<(pageNumber: number) => void>(() => {})

  useEffect(() => {
    if (!editor || !onMarksChange) return
    const updateMarks = () => onMarksChange(hasUserMarks(editor.getCurrentPageShapes()))
    const stop = editor.store.listen(updateMarks, { scope: 'document' })
    updateMarks()
    return stop
  }, [editor, onMarksChange])

  useEffect(() => {
    if (!editor || !document || document.pages.length === 0) return
    placePagesOnCanvas(editor, document.pages)

    let active = true
    const renderedPages = new Map<number, RenderedPdfPage>()
    const renderingPages = new Set<number>()
    const failedPages = new Set<number>()
    let updating = false

    const updateVisiblePages = () => {
      if (!active || updating) return
      updating = true
      try {
        const bounds = editor.getViewportPageBounds()
        const visible = visiblePageNumbers(document.pages, bounds)
        const visibleSet = new Set(visible)
        for (const pageNumber of renderedPages.keys()) {
          if (!visibleSet.has(pageNumber)) renderedPages.delete(pageNumber)
        }

        syncVisiblePages(editor, document.pages, visible, [])
        const nextPage = activePageNumber(document.pages, bounds)
        setPage(previous => (previous === nextPage ? previous : nextPage))
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
            .then(pages => {
              if (!active) return
              const currentVisible = visiblePageNumbers(
                document.pages,
                editor.getViewportPageBounds()
              )
              const rendered = pages.filter(page => currentVisible.includes(page.pageNumber))
              for (const page of rendered) renderedPages.set(page.pageNumber, page)
              syncVisiblePages(editor, document.pages, currentVisible, rendered)
            })
            .catch(() => {
              if (!active) return
              failedPages.add(pageNumber)
            })
            .finally(() => {
              renderingPages.delete(pageNumber)
              if (active) updateVisiblePages()
            })
        }
        setOverlays(
          visible.flatMap(pageNumber => {
            if (!renderingPages.has(pageNumber) && !failedPages.has(pageNumber)) return []
            const pageBox = pageBounds(document.pages, pageNumber)
            if (!pageBox) return []
            const topLeft = editor.pageToViewport({ x: pageBox.x, y: pageBox.y })
            return [
              {
                page: pageNumber,
                state: failedPages.has(pageNumber) ? ('error' as const) : ('loading' as const),
                x: topLeft.x,
                y: topLeft.y,
                w: pageBox.w * editor.getZoomLevel(),
                h: pageBox.h * editor.getZoomLevel()
              }
            ]
          })
        )
      } finally {
        updating = false
      }
    }

    retryPage.current = pageNumber => {
      failedPages.delete(pageNumber)
      updateVisiblePages()
    }
    const stopListening = editor.store.listen(updateVisiblePages, { scope: 'session' })
    queueMicrotask(updateVisiblePages)
    return () => {
      active = false
      retryPage.current = () => {}
      stopListening()
      syncVisiblePages(editor, document.pages, [], [])
      renderedPages.clear()
    }
  }, [editor, document])

  const jumpToPage = (pageNumber: number) => {
    if (!editor || !document) return
    const bounds = pageBounds(document.pages, pageNumber)
    if (bounds) editor.centerOnPoint({ x: bounds.x + bounds.w / 2, y: bounds.y + bounds.h / 2 })
  }

  return (
    <div style={{ position: 'absolute', inset: 0 }}>
      <Tldraw onMount={setEditor} />

      {isLoading ? (
        <Flex
          align="center"
          aria-label="Opening the document"
          aria-live="polite"
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

      {overlays.map(overlay => (
        <Flex
          align="center"
          bg="bg.panel"
          justify="center"
          key={overlay.page}
          pointerEvents="none"
          aria-label={`Page ${overlay.page} ${overlay.state === 'error' ? 'did not load' : 'is loading'}`}
          position="absolute"
          role={overlay.state === 'error' ? 'alert' : 'status'}
          style={{ left: overlay.x, top: overlay.y, width: overlay.w, height: overlay.h }}
        >
          {overlay.state === 'loading' ? (
            <Spinner aria-label={`Loading page ${overlay.page}`} />
          ) : (
            <Box pointerEvents="auto" textAlign="center">
              <Text>Page {overlay.page} couldn't load.</Text>
              <Button onClick={() => retryPage.current(overlay.page)} size="sm">
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
