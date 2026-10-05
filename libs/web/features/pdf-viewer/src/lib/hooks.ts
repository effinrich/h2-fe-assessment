import { useQuery } from "@tanstack/react-query"
import { useCallback, useEffect, useRef, useState } from "react"
import { react, unsafe__withoutCapture, type BoxModel, type Editor } from "tldraw"

import type {
  FileToken,
  MergedCanvasExtensions,
  PageOverlay,
  PdfViewerScreenProps,
  RenderedPdfPage
} from "./types"

import {
  activePageNumber,
  hasUserMarks,
  keptPageNumbers,
  openPdf,
  pageBounds,
  pageOverlays,
  placePagesOnCanvas,
  sameOverlays,
  samePageNumbers,
  syncVisiblePages,
  visiblePageNumbers
} from "./utils"

const NO_BOXES: readonly BoxModel[] = []

const fileTokens = new WeakMap<File, string>()
let nextFileToken = 0

export function pdfFileToken(file: File | null): FileToken | null {
  if (!file) return null
  let token = fileTokens.get(file)
  if (!token) {
    token = `pdf-${nextFileToken++}`
    fileTokens.set(file, token)
  }
  return token
}

// Rasterisation is the expensive step, so: no retry storms with retry:false,
// never evicted mid-session with staleTime:Infinity, and disabled until a
// document is actually on the way.
export function usePdfPages(file: File | null) {
  return useQuery({
    enabled: file !== null,
    queryFn: async ({ signal }) => {
      const data = await file!.arrayBuffer()
      if (signal.aborted) throw signal.reason
      const document = await openPdf(data)
      if (signal.aborted) await document.destroy()
      return document
    },
    queryKey: ["pdf-pages", pdfFileToken(file)],
    retry: false,
    staleTime: Infinity,
    gcTime: 0
  })
}

/** The mounted editor, kept in the app's colour mode, with every extension's `onMount` run. */
export function useCanvasEditor(colorMode: "light" | "dark", merged: MergedCanvasExtensions) {
  const [editor, setEditor] = useState<Editor | null>(null)
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
  return { editor, handleMount }
}

export function useMarksChange(
  editor: Editor | null,
  onMarksChange: PdfViewerScreenProps["onMarksChange"]
) {
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
}

/**
 * Page virtualisation: only pages on screen (or under a retained box) are
 * shapes, rasterised on demand. Reports the active page and the loading /
 * failed overlays, and navigates by page.
 */
export function useVisiblePages(
  editor: Editor | null,
  document: PdfViewerScreenProps["document"],
  retainPageBounds: PdfViewerScreenProps["retainPageBounds"]
) {
  const retainPageBoundsRef = useRef(retainPageBounds)
  useEffect(() => {
    retainPageBoundsRef.current = retainPageBounds
  }, [retainPageBounds])
  const [page, setPage] = useState(1)
  const [overlays, setOverlays] = useState<PageOverlay[]>([])
  const retryPage = useRef<(pageNumber: number) => void>(() => {})

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

      const nextOverlays = pageOverlays(
        editor,
        document.pages,
        onScreen,
        renderingPages,
        failedPages
      )
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
  const handleRetryPage = useCallback((pageNumber: number) => retryPage.current(pageNumber), [])

  return { page, overlays, jumpToPage, retryPage: handleRetryPage }
}
