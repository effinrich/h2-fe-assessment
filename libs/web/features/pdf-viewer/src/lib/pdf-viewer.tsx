import { useEffect, useState } from 'react'
import { Tldraw, type Editor } from 'tldraw'
import { Box, Button, Flex, Heading, Spinner, Text } from '@h2-fe/ui'
import { ViewerTopBar } from '@h2-fe/web-ui'
import { placePagesOnCanvas } from './utils'
import type { PdfViewerScreenProps } from './types'

// The route's own surface: tldraw mounts once per document (the route element
// remounts per navigation, so no key gymnastics), and the pages the route
// wrapper hands down are placed as locked shapes. The screen holds the editor
// but no server state — loading, error, and retry are all props.
export function PdfViewerScreen({
  pages,
  isLoading,
  isError,
  onRetry,
  onOpenAnother
}: PdfViewerScreenProps) {
  const [editor, setEditor] = useState<Editor | null>(null)

  useEffect(() => {
    if (!editor || !pages || pages.length === 0) return
    placePagesOnCanvas(editor, pages)
  }, [editor, pages])

  return (
    <div style={{ position: 'absolute', inset: 0 }}>
      <Tldraw onMount={setEditor} />

      {isLoading ? (
        <Flex align="center" inset="0" justify="center" pointerEvents="none" position="absolute">
          <Spinner data-testid="viewer-loading" size="lg" />
        </Flex>
      ) : isError ? (
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
