import { useQuery } from "@tanstack/react-query"
import { useCallback, useEffect, useState } from "react"
import { react, type Editor } from "tldraw"

import type { FileToken, PdfViewerScreenProps } from "./types"

import { activePageNumber, hasUserMarks, openPdf, pageBounds, placePages } from "./utils"

const fileTokens = new WeakMap<File, string>()
let nextFileToken = 0

function pdfFileToken(file: File | null): FileToken | null {
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
      return openPdf(data)
    },
    queryKey: ["pdf-pages", pdfFileToken(file)],
    retry: false,
    staleTime: Infinity,
    gcTime: 0
  })
}

/** The mounted editor, kept in the app's colour mode. */
export function useCanvasEditor(colorMode: "light" | "dark") {
  const [editor, setEditor] = useState<Editor | null>(null)
  const handleMount = useCallback(
    (mountedEditor: Editor) => {
      mountedEditor.setColorMode(colorMode)
      setEditor(mountedEditor)
    },
    [colorMode]
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

/** Puts the document's pages on the canvas, tracks the page in view and navigates by page. */
export function usePageNavigation(
  editor: Editor | null,
  document: PdfViewerScreenProps["document"]
) {
  const [page, setPage] = useState(1)

  useEffect(() => {
    if (!editor || !document || document.pages.length === 0) return () => {}
    const removePages = placePages(editor, document.pages)
    const stopTracking = react("pdf-viewer active page", () => {
      setPage(activePageNumber(document.pages, editor.getViewportPageBounds()))
    })
    return () => {
      stopTracking()
      removePages()
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

  return { page, jumpToPage }
}
