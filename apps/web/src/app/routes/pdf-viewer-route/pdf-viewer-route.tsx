import { useEffect, useMemo } from "react"
import { useLocation, useNavigate } from "react-router-dom"

import { createCameraExtension } from "@h2-fe/camera"
import { PdfViewerScreen, usePdfPages } from "@h2-fe/pdf-viewer"
import type { CanvasExtension } from "@h2-fe/pdf-viewer"
import { pinExtension } from "@h2-fe/pin"

import { useLeaveGuard } from "./hooks"
import { LeaveDocumentModal } from "./partials/leave-document-modal"

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
  const documentName = file?.name
  const extensions = useMemo<readonly CanvasExtension[]>(
    () => [pinExtension, createCameraExtension({ documentName })],
    [documentName]
  )
  const { setHasMarks, confirmExit, setConfirmExit, onOpenAnother, leave } = useLeaveGuard()
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
      />
      <LeaveDocumentModal onDiscard={leave} onOpenChange={setConfirmExit} open={confirmExit} />
    </>
  )
}
