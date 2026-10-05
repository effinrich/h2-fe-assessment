import { useCallback } from "react"

import { Button, Spinner, Stack, Text } from "@h2-fe/ui"

import type { PageOverlay } from "../types"

import { PageOverlayCard } from "./viewer-chrome"

interface ViewerPageOverlayProps {
  overlay: PageOverlay
  onRetryPage: (pageNumber: number) => void
}

/** Sits over one on-screen page that is still rasterising, or failed to. */
export function ViewerPageOverlay({ overlay, onRetryPage }: ViewerPageOverlayProps) {
  const { page, state, style } = overlay
  const handleRetry = useCallback(() => onRetryPage(page), [onRetryPage, page])

  return (
    <PageOverlayCard
      aria-label={`Page ${page} ${state === "error" ? "did not load" : "is loading"}`}
      css={{
        left: `${style.left}px`,
        top: `${style.top}px`,
        width: `${style.width}px`,
        height: `${style.height}px`
      }}
      role={state === "error" ? "alert" : "status"}
    >
      {state === "loading" ? (
        <Spinner aria-label={`Loading page ${page}`} />
      ) : (
        <Stack gap="2" pointerEvents="auto" textAlign="center">
          <Text>Page {page} couldn't load.</Text>
          <Button onClick={handleRetry} size="sm">
            Retry page {page}
          </Button>
        </Stack>
      )}
    </PageOverlayCard>
  )
}
