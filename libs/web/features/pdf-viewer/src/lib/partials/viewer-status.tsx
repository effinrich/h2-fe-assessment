import { Button, Heading, Spinner, Stack, Text } from "@h2-fe/ui"

import type { PdfViewerScreenProps } from "../types"

import { ViewerCover, ViewerPanel } from "./viewer-chrome"

type ViewerStatusProps = Pick<PdfViewerScreenProps, "isLoading" | "isError" | "onRetry">

/** Covers the canvas while the document opens, or when it fails to. */
export function ViewerStatus({ isLoading, isError, onRetry }: ViewerStatusProps) {
  if (isLoading) {
    return (
      <ViewerCover aria-label="Opening the document" as="output">
        <Spinner data-testid="viewer-loading" size="lg" />
      </ViewerCover>
    )
  }
  if (!isError) return null
  return (
    <ViewerCover>
      <ViewerPanel role="alert">
        <Stack gap="6">
          <Stack gap="2">
            <Heading size="lg">The document didn't open</Heading>
            <Text>The file may be unreadable or in an unsupported PDF dialect.</Text>
          </Stack>
          <Button variant="solid" w="full" onClick={onRetry}>
            Try again
          </Button>
        </Stack>
      </ViewerPanel>
    </ViewerCover>
  )
}
