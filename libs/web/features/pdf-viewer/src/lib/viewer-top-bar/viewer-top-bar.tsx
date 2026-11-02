import { FileDown, FolderOpen } from "lucide-react"

import { Button, chakra, ColorModeButton, Text } from "@h2-fe/ui"

import { AppHeader } from "../app-header/app-header"
import { ViewerPageNav } from "./partials/viewer-page-nav"

interface ViewerTopBarProps {
  filename?: string
  page: number
  totalPages: number
  onPageChange: (page: number) => void
  onOpenAnother: () => void
  onExportPdf: () => void
  canExport: boolean
  isExporting: boolean
}

export function ViewerTopBar({
  filename,
  page,
  totalPages,
  onPageChange,
  onOpenAnother,
  onExportPdf,
  canExport,
  isExporting
}: ViewerTopBarProps) {
  return (
    <AppHeader
      start={
        <Text color="fg.muted" fontSize="sm" title={filename} truncate>
          {filename ?? "Document"}
        </Text>
      }
      end={
        <>
          <ColorModeButton />
          <Button
            aria-label="Export the document as a PDF"
            disabled={!canExport}
            onClick={onExportPdf}
            size="sm"
            variant="outline"
          >
            <FileDown />
            <chakra.span hideBelow="md">{isExporting ? "Exporting…" : "Export PDF"}</chakra.span>
          </Button>
          <Button
            aria-label="Open another document"
            onClick={onOpenAnother}
            size="sm"
            variant="outline"
          >
            <FolderOpen />
            <chakra.span hideBelow="md">Open another</chakra.span>
          </Button>
        </>
      }
    >
      {totalPages > 0 && (
        <ViewerPageNav onPageChange={onPageChange} page={page} totalPages={totalPages} />
      )}
    </AppHeader>
  )
}
