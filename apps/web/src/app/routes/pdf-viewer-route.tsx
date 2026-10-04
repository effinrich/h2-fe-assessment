import { useCallback, useEffect, useMemo, useRef, useState } from "react"
import { useLocation, useNavigate } from "react-router-dom"

import { createCameraExtension, getCropFrameBounds } from "@h2-fe/camera"
import { isPdfPageShape, PdfViewerScreen, usePdfPages } from "@h2-fe/pdf-viewer"
import type { CanvasExtension, PdfDocumentSummary } from "@h2-fe/pdf-viewer"
import { createPinExtension } from "@h2-fe/pin"
import { Box, Button, Flex, Heading, Text } from "@h2-fe/ui"

const pinExtension = createPinExtension({ canAttach: (shape) => !isPdfPageShape(shape) })

// The route that owns the document: it reads the file home handed off through
// the navigation state, rasterises it through the lib's query hook, and
// populates the screen. A deep link or refresh with no handoff redirects home
// rather than showing a half-canvas.
export default function PdfViewerRoute() {
  const location = useLocation()
  const navigate = useNavigate()
  const file = (location.state as { file?: File } | null)?.file ?? null
  const result = usePdfPages(file)
  const document = result.data
  const activeDocument = useRef<PdfDocumentSummary | null>(null)
  const [hasMarks, setHasMarks] = useState(false)
  const [confirmExit, setConfirmExit] = useState(false)
  const confirmDialog = useRef<HTMLDialogElement>(null)
  const documentName = file?.name
  const extensions = useMemo<readonly CanvasExtension[]>(
    () => [pinExtension, createCameraExtension({ documentName })],
    [documentName]
  )

  useEffect(() => {
    const dialog = confirmDialog.current
    if (!dialog) return
    if (confirmExit && !dialog.open) dialog.showModal()
    if (!confirmExit && dialog.open) dialog.close()
  }, [confirmExit])

  const onOpenAnother = useCallback(() => {
    if (hasMarks) setConfirmExit(true)
    else navigate("/", { replace: true })
  }, [hasMarks, navigate])

  useEffect(() => {
    if (!hasMarks) return
    const warn = (event: BeforeUnloadEvent) => {
      event.preventDefault()
      event.returnValue = ""
    }
    window.addEventListener("beforeunload", warn)
    return () => window.removeEventListener("beforeunload", warn)
  }, [hasMarks])
  useEffect(() => {
    activeDocument.current = document ?? null
    if (!document) return
    return () => {
      activeDocument.current = null
      queueMicrotask(() => {
        if (activeDocument.current !== document) void document.destroy()
      })
    }
  }, [document])
  useEffect(() => {
    if (!file) navigate("/", { replace: true })
  }, [file, navigate])

  if (!file) return null

  return (
    <>
      <PdfViewerScreen
        filename={file.name}
        onMarksChange={setHasMarks}
        isLoading={result.isLoading}
        isError={result.isError}
        onOpenAnother={onOpenAnother}
        onRetry={() => {
          void result.refetch()
        }}
        document={document}
        extensions={extensions}
        retainPageBounds={getCropFrameBounds}
      />
      <dialog
        aria-describedby="discard-body"
        aria-labelledby="discard-title"
        onCancel={() => setConfirmExit(false)}
        ref={confirmDialog}
        style={{
          border: 0,
          borderRadius: 12,
          margin: "auto",
          maxWidth: 380,
          width: "calc(100% - 32px)"
        }}
      >
        <Box bg="bg.panel" color="fg" p="6">
          <Heading id="discard-title" size="md">
            Leave this document?
          </Heading>
          <Text id="discard-body" mt="2">
            Your marks aren't saved and will be lost.
          </Text>
          <Flex gap="3" mt="6">
            <Button onClick={() => setConfirmExit(false)}>Keep working</Button>
            <Button
              colorPalette="red"
              onClick={() => navigate("/", { replace: true })}
              variant="outline"
            >
              Discard marks
            </Button>
          </Flex>
        </Box>
      </dialog>
    </>
  )
}
