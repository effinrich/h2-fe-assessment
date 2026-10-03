import { useEffect, useState } from 'react'
import { Tldraw, type Editor } from 'tldraw'
import 'tldraw/tldraw.css'
import { Box, Button, Flex, Heading, Spinner, Text } from '@h2-fe/ui'
import { ViewerTopBar } from '@h2-fe/web-ui'
import { placePagesOnCanvas, syncVisiblePages, visiblePageNumbers } from './utils'
import type { PdfViewerScreenProps, RenderedPdfPage } from './types'

// The route's own surface: tldraw mounts once per document (the route element
// remounts per navigation), and visible pages are placed as locked shapes. The
// screen holds the editor but no server state — loading, error, and retry are props.
export function PdfViewerScreen({
  document,
  isLoading,
  isError,
  onRetry,
  onOpenAnother
}: PdfViewerScreenProps) {
  const [editor, setEditor] = useState<Editor | null>(null)
  const [renderError, setRenderError] = useState(false)

  useEffect(() => {
    if (!editor || !document || document.pages.length === 0) return
    setRenderError(false)
    placePagesOnCanvas(editor, document.pages)

    let active = true
    const renderedPages = new Map<number, RenderedPdfPage>()
    const renderingPages = new Set<number>()
    const updateVisiblePages = () => {
      const visible = visiblePageNumbers(document.pages, editor.getViewportPageBounds())
      const visibleSet = new Set(visible)
      for (const pageNumber of renderedPages.keys()) {
        if (!visibleSet.has(pageNumber)) renderedPages.delete(pageNumber)
      }

      syncVisiblePages(editor, document.pages, visible, [])
      const missing = visible.filter(
        pageNumber => !renderedPages.has(pageNumber) && !renderingPages.has(pageNumber)
      )
      if (missing.length === 0) return

      missing.forEach(pageNumber => renderingPages.add(pageNumber))
      void document
        .renderPages(missing)
        .then(pages => {
          if (!active) return
          const currentVisible = visiblePageNumbers(document.pages, editor.getViewportPageBounds())
          const currentVisibleSet = new Set(currentVisible)
          for (const page of pages) {
            if (currentVisibleSet.has(page.pageNumber)) renderedPages.set(page.pageNumber, page)
          }
          syncVisiblePages(
            editor,
            document.pages,
            currentVisible,
            pages.filter(page => currentVisibleSet.has(page.pageNumber))
          )
        })
        .catch(() => {
          if (!active) return
          const currentVisible = new Set(
            visiblePageNumbers(document.pages, editor.getViewportPageBounds())
          )
          if (missing.some(pageNumber => currentVisible.has(pageNumber))) setRenderError(true)
        })
        .finally(() => {
          missing.forEach(pageNumber => renderingPages.delete(pageNumber))
        })
    }

    const stopListening = editor.store.listen(updateVisiblePages, { scope: 'session' })
    updateVisiblePages()
    return () => {
      active = false
      stopListening()
      syncVisiblePages(editor, document.pages, [], [])
      renderedPages.clear()
    }
  }, [editor, document])

  return (
    <div style={{ position: 'absolute', inset: 0 }}>
      <Tldraw onMount={setEditor} />

      {isLoading ? (
        <Flex align="center" inset="0" justify="center" pointerEvents="none" position="absolute">
          <Spinner data-testid="viewer-loading" size="lg" />
        </Flex>
      ) : isError || renderError ? (
        <Flex align="center" inset="0" justify="center" pointerEvents="none" position="absolute">
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
            <Text marginTop="2">
              The file may be unreadable or an unsupported PDF dialect. Try again, or open a
              different document.
            </Text>
            <Button marginTop="6" variant="solid" w="full" onClick={onRetry}>
              Try again
            </Button>
          </Box>
        </Flex>
      ) : null}

      <ViewerTopBar onOpenAnother={onOpenAnother} />
    </div>
  )
}
