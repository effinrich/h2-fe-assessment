import { AppHeader } from "@h2-fe/pdf-viewer/app-header"
import { ColorModeButton, Grid, Heading, Separator, Stack, Text } from "@h2-fe/ui"

import type { HomeScreenProps } from "./types"

import { useFileDrop } from "./hooks"
import { Canvas, Page } from "./partials/home-chrome"
import { HomeOpenActions } from "./partials/home-open-actions"
import { HomeSheet } from "./partials/home-sheet"
import { HomeToolHints } from "./partials/home-tool-hints"

// The route's own composition: teach what the canvas is for and offer three
// ways in (pick, example, drop). The route provides callbacks; this screen
// holds only markup and the drag-over highlight.
export function HomeScreen({
  onFileChange,
  onDropFile,
  onRejectDrop,
  onUseExample,
  isBusy = false
}: HomeScreenProps) {
  const { dragging, dropHandlers } = useFileDrop({ isBusy, onDropFile, onRejectDrop })

  return (
    <Page {...dropHandlers}>
      <AppHeader end={<ColorModeButton />} />
      <Canvas>
        <Grid
          alignItems="center"
          gap={{ base: "8", md: "12" }}
          maxW="4xl"
          templateColumns={{ base: "1fr", md: "minmax(0, 1fr) auto" }}
          w="full"
        >
          <Stack gap="5">
            <Heading lineHeight="1.15" size="4xl" textWrap="balance">
              {dragging ? "Drop to open" : "Open a PDF to start marking up"}
            </Heading>
            <Text color="fg.muted" textWrap="balance">
              Pages render on an infinite canvas. Everything stays in your browser.
            </Text>
            <HomeOpenActions
              isBusy={isBusy}
              onFileChange={onFileChange}
              onUseExample={onUseExample}
            />
            <Text color="fg.muted" textStyle="xs">
              or drop a PDF anywhere
            </Text>
            <Separator />
            <HomeToolHints />
          </Stack>
          <HomeSheet dragging={dragging} />
        </Grid>
      </Canvas>
    </Page>
  )
}
