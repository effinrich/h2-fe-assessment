import { FolderOpen } from "lucide-react"

import { Button, chakra, ColorModeButton, Text } from "@h2-fe/ui"

import { AppHeader } from "../app-header/app-header"
import { ViewerPageNav } from "./partials/viewer-page-nav"

interface ViewerTopBarProps {
  filename?: string
  page: number
  totalPages: number
  onPageChange: (page: number) => void
  onOpenAnother: () => void
}

export function ViewerTopBar({
  filename,
  page,
  totalPages,
  onPageChange,
  onOpenAnother
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
