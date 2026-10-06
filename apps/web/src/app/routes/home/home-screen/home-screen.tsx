import { FileText } from "lucide-react"

import { AppHeader } from "@h2-fe/pdf-viewer"
import { ColorModeButton, Heading, Icon, Stack, Text } from "@h2-fe/ui"

import type { HomeScreenProps } from "./types"

import { useFileDrop } from "./hooks"
import { Canvas, DropCard, FileTile, Page } from "./partials/home-chrome"
import { HomeOpenActions } from "./partials/home-open-actions"
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
        <DropCard data-dragging={dragging || undefined}>
          <FileTile aria-hidden>
            <Icon asChild boxSize="6">
              <FileText strokeWidth={1.75} />
            </Icon>
          </FileTile>
          <Stack gap="2">
            <Heading size="xl" textWrap="balance">
              {dragging ? "Drop to open" : "Open a PDF to start marking up"}
            </Heading>
            <Text color="fg.muted" textWrap="balance">
              Pages render on an infinite canvas. Everything stays in your browser.
            </Text>
          </Stack>
          <HomeOpenActions
            isBusy={isBusy}
            onFileChange={onFileChange}
            onUseExample={onUseExample}
          />
          <Text color="fg.muted" textStyle="xs">
            or drop a PDF anywhere
          </Text>
        </DropCard>
        <HomeToolHints />
      </Canvas>
    </Page>
  )
}
