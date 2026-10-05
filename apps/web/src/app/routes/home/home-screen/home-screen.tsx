import { FileText } from "lucide-react"
import { useState, type DragEvent } from "react"

import {
  Button,
  chakra,
  ColorModeButton,
  FileUpload,
  Heading,
  HStack,
  Icon,
  Kbd,
  Stack,
  Text
} from "@h2-fe/ui"
import { AppHeader } from "@h2-fe/web-ui"

import type { HomeScreenProps } from "./types"

const TOOL_HINTS = [
  { key: "P", label: "Pin shapes together" },
  { key: "C", label: "Export an area as PNG or SVG" },
  { key: "D", label: "Draw, write, highlight" }
] as const

function isPdf(file: File) {
  return file.type === "application/pdf" || /\.pdf$/i.test(file.name)
}

function carriesFiles(event: DragEvent) {
  return Array.from(event.dataTransfer.types).includes("Files")
}

const Page = chakra("div", {
  base: { display: "flex", flexDirection: "column", minH: "100dvh" }
})

// The surface the document will land on, dotted like the canvas it becomes.
const Canvas = chakra("main", {
  base: {
    alignItems: "center",
    bg: "bg.canvas",
    backgroundImage: "radial-gradient(circle, {colors.border.emphasized} 1px, transparent 1px)",
    backgroundSize: "20px 20px",
    display: "flex",
    flex: "1",
    flexDirection: "column",
    gap: "8",
    justifyContent: "center",
    p: { base: "4", md: "8" }
  }
})

const DropCard = chakra("div", {
  base: {
    alignItems: "center",
    bg: "bg.panel",
    borderColor: "border.emphasized",
    borderRadius: "xl",
    borderStyle: "dashed",
    borderWidth: "2px",
    boxShadow: "sm",
    color: "fg",
    display: "flex",
    flexDirection: "column",
    gap: "6",
    maxW: "md",
    p: { base: "6", md: "10" },
    textAlign: "center",
    transitionDuration: "moderate",
    transitionProperty: "background, border-color",
    w: "full",
    _dragging: { bg: "brand.subtle", borderColor: "brand.solid" }
  }
})

const FileTile = chakra("span", {
  base: {
    alignItems: "center",
    bg: "bg.muted",
    borderRadius: "lg",
    color: "fg.muted",
    display: "inline-flex",
    h: "12",
    justifyContent: "center",
    w: "12"
  }
})

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
  const [dragging, setDragging] = useState(false)

  // Files are always taken (preventDefault) so a drop while busy never makes
  // the browser navigate to the file instead.
  const onDragOver = (event: DragEvent<HTMLDivElement>) => {
    if (!carriesFiles(event)) return
    event.preventDefault()
    event.dataTransfer.dropEffect = isBusy ? "none" : "copy"
    if (!isBusy) setDragging(true)
  }
  const onDragLeave = (event: DragEvent<HTMLDivElement>) => {
    if (event.relatedTarget instanceof Node && event.currentTarget.contains(event.relatedTarget))
      return
    setDragging(false)
  }
  const onDrop = (event: DragEvent<HTMLDivElement>) => {
    event.preventDefault()
    setDragging(false)
    if (isBusy) return
    const files = Array.from(event.dataTransfer.files)
    const [file] = files
    if (files.length === 1 && file && isPdf(file)) onDropFile(file)
    else onRejectDrop()
  }

  return (
    <Page onDragLeave={onDragLeave} onDragOver={onDragOver} onDrop={onDrop}>
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
          <Stack direction={{ base: "column", sm: "row" }} gap="2" justify="center" w="full">
            <FileUpload.Root
              accept="application/pdf"
              disabled={isBusy}
              maxFiles={1}
              w={{ base: "full", sm: "auto" }}
            >
              <FileUpload.HiddenInput onChange={onFileChange} />
              <FileUpload.Trigger asChild>
                <Button disabled={isBusy} variant="solid" w={{ base: "full", sm: "auto" }}>
                  {isBusy ? "Opening" : "Open PDF"}
                </Button>
              </FileUpload.Trigger>
            </FileUpload.Root>
            <Button
              disabled={isBusy}
              onClick={onUseExample}
              variant="outline"
              w={{ base: "full", sm: "auto" }}
            >
              Use an example
            </Button>
          </Stack>
          <Text color="fg.muted" textStyle="xs">
            or drop a PDF anywhere
          </Text>
        </DropCard>
        <HStack
          aria-label="Tools on the canvas"
          as="ul"
          color="fg.muted"
          columnGap="6"
          flexWrap="wrap"
          justify="center"
          listStyle="none"
          rowGap="2"
          textStyle="sm"
        >
          {TOOL_HINTS.map(({ key, label }) => (
            <HStack as="li" gap="2" key={key}>
              <Kbd size="sm">{key}</Kbd>
              {label}
            </HStack>
          ))}
        </HStack>
      </Canvas>
    </Page>
  )
}
