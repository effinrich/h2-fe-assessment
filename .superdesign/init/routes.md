# Routes

Superdesign init: routing for `apps/web`.

- **Router:** React Router 6.30 (`react-router-dom`), `BrowserRouter` in `apps/web/src/main.tsx`.
- **Route table:** `apps/web/src/app/app.tsx`. Two routes, no nesting, no layout route, no 404 route.
- **Handoff:** home passes the chosen `File` to the viewer through navigation state (`navigate("/viewer", { state: { file } })`). There is no URL parameter, so a refresh or deep link to `/viewer` redirects to `/`.

| Path      | Component                            | File                                                                                                                   | Loading                                                   |
| --------- | ------------------------------------ | ---------------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------- |
| `/`       | `HomeRoute` → `HomeScreen`           | `apps/web/src/app/routes/home/home.tsx`, `apps/web/src/app/routes/home/home-screen/home-screen.tsx`                    | eager                                                     |
| `/viewer` | `PdfViewerRoute` → `PdfViewerScreen` | `apps/web/src/app/routes/pdf-viewer-route/pdf-viewer-route.tsx`, `libs/web/features/pdf-viewer/src/lib/pdf-viewer.tsx` | `React.lazy` + `Suspense` (centred `xl` Spinner fallback) |

## Router config

`apps/web/src/app/app.tsx` (34 lines)

```tsx
import { lazy, Suspense } from "react"
import { Route, Routes } from "react-router-dom"

import { Center, Spinner } from "@h2-fe/ui"

import HomeRoute from "./routes/home/home"

// The route table is the whole app: home first, the document canvas lazily so
// tldraw, pdfjs and its css leave the initial bundle. Each route wrapper owns
// its redirect and fallback semantics; this file owns only the table and the
// chunk boundary.
const PdfViewerRoute = lazy(() => import("./routes/pdf-viewer-route/pdf-viewer-route"))

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<HomeRoute />} />
      <Route
        path="/viewer"
        element={
          <Suspense
            fallback={
              <Center minH="100dvh">
                <Spinner size="xl" />
              </Center>
            }
          >
            <PdfViewerRoute />
          </Suspense>
        }
      />
    </Routes>
  )
}
```

## `/`: Home

**Renders:** a centred card on a full-height page, with a colour-mode toggle in the top-right corner. Card content: heading "Open a document", text "A PDF lands on the canvas, ready to mark up.", a full-width solid **Open PDF** button (file picker, `application/pdf`, one file) and a full-width outline **Use an example** button (generates a two-page PDF with pdf-lib). While the example is being generated both buttons are disabled and the primary label reads "Opening". If generation fails, an error toast appears: "The example document could not be created." / "Try again, or open your own PDF."

- Route component (state + navigation): `apps/web/src/app/routes/home/home.tsx`
- Presentational screen: `apps/web/src/app/routes/home/home-screen/home-screen.tsx` (+ `types.ts`)
- Example PDF generator: `apps/web/src/app/routes/home/utils.ts`

`apps/web/src/app/routes/home/home.tsx` (42 lines)

```tsx
import { useState, type ChangeEvent } from "react"
import { useNavigate } from "react-router-dom"

import { toaster } from "@h2-fe/ui"

import { HomeScreen } from "./home-screen/home-screen"
import { createExamplePdf } from "./utils"

// The route that owns the file handoff. It holds the busy flag for the
// example-generation moment and navigates with the file in tow; the screen
// itself stays dumb.
export default function HomeRoute() {
  const navigate = useNavigate()
  const [isBusy, setIsBusy] = useState(false)

  const openViewerWith = (file: File) => {
    navigate("/viewer", { state: { file } })
  }

  const handlePick = (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    event.target.value = ""
    if (file) openViewerWith(file)
  }

  const onUseExample = async () => {
    setIsBusy(true)
    try {
      openViewerWith(await createExamplePdf())
    } catch {
      toaster.create({
        title: "The example document could not be created.",
        description: "Try again, or open your own PDF.",
        type: "error"
      })
    } finally {
      setIsBusy(false)
    }
  }

  return <HomeScreen isBusy={isBusy} onFileChange={handlePick} onUseExample={onUseExample} />
}
```

`apps/web/src/app/routes/home/home-screen/home-screen.tsx` (49 lines)

```tsx
import { Button, ColorModeButton, FileUpload, Flex, Heading, Stack, Text } from "@h2-fe/ui"

import type { HomeScreenProps } from "./types"

// The route's own composition: teach what the canvas is for and offer two ways
// in. The route provides callbacks; this screen holds only markup.
export function HomeScreen({ onFileChange, onUseExample, isBusy = false }: HomeScreenProps) {
  return (
    <Flex
      align="center"
      justify="center"
      minH="100dvh"
      p={{ base: "4", md: "8" }}
      position="relative"
    >
      <ColorModeButton position="absolute" right="4" top="4" />
      <Stack
        bg="bg.panel"
        borderColor="border"
        borderRadius="lg"
        borderWidth="1px"
        boxShadow="lg"
        color="fg"
        gap="6"
        maxW="sm"
        p={{ base: "6", md: "8" }}
        w="full"
      >
        <Stack gap="2">
          <Heading size="lg">Open a document</Heading>
          <Text>A PDF lands on the canvas, ready to mark up.</Text>
        </Stack>
        <Stack gap="2">
          <FileUpload.Root accept="application/pdf" disabled={isBusy} maxFiles={1} w="full">
            <FileUpload.HiddenInput onChange={onFileChange} />
            <FileUpload.Trigger asChild>
              <Button disabled={isBusy} variant="solid" w="full">
                {isBusy ? "Opening" : "Open PDF"}
              </Button>
            </FileUpload.Trigger>
          </FileUpload.Root>
          <Button disabled={isBusy} variant="outline" w="full" onClick={onUseExample}>
            Use an example
          </Button>
        </Stack>
      </Stack>
    </Flex>
  )
}
```

`apps/web/src/app/routes/home/home-screen/types.ts` (7 lines)

```ts
import type { ChangeEventHandler } from "react"

export interface HomeScreenProps {
  onFileChange: ChangeEventHandler<HTMLInputElement>
  onUseExample: () => void
  isBusy?: boolean
}
```

`apps/web/src/app/routes/home/utils.ts` (38 lines)

```ts
import { PDFDocument, StandardFonts, rgb } from "pdf-lib"

// "Use an example" needs a document and we ship no fixtures, so we draw one.
// pdf-lib is already a direct dependency for this route only.
export async function createExamplePdf(): Promise<File> {
  const document = await PDFDocument.create()
  const font = await document.embedFont(StandardFonts.Helvetica)
  const bold = await document.embedFont(StandardFonts.HelveticaBold)

  for (const pageNumber of [1, 2]) {
    const page = document.addPage([595, 842])
    page.drawText(`Example page ${pageNumber}`, {
      x: 56,
      y: 762,
      size: 26,
      font: bold,
      color: rgb(0.08, 0.08, 0.09)
    })
    page.drawText("Draw on this page with the tools in the top left.", {
      x: 56,
      y: 722,
      size: 13,
      font,
      color: rgb(0.35, 0.35, 0.38)
    })
    page.drawLine({
      start: { x: 56, y: 700 },
      end: { x: 539, y: 700 },
      thickness: 1,
      color: rgb(0.85, 0.85, 0.87)
    })
  }

  const bytes = await document.save()
  // slice() allocates a fresh ArrayBuffer-backed view; pdf-lib's output is typed
  // as ArrayBufferLike, which BlobPart does not accept.
  return new File([bytes.slice()], "example.pdf", { type: "application/pdf" })
}
```

## `/viewer`: PDF viewer canvas (lazy)

**Renders:** a full-bleed tldraw canvas with the PDF's pages laid out vertically as locked image shapes (40 page-unit gap), rasterised lazily as they scroll into view. Over the canvas:

- `ViewerTopBar` (filename, pager "Previous [n] of N Next", colour-mode toggle, "Open another document").
- tldraw's stock toolbar with two extra tools first: **Pin** (`p`, pushpins that attach shapes together) and **Export area** (`c`, the camera: drag a crop frame, then download PNG / copy image / download SVG from a contextual toolbar).
- tldraw's style panel (top right, moved down below the top bar).
- States: a centred spinner while the document opens; a centred error card "The document didn't open" + **Try again**; per-page spinner or "Page N couldn't load." + **Retry page N** cards.
- Leaving with marks on the canvas opens the **"Leave this document?"** modal ("Your marks aren't saved and will be lost." / **Keep working** / red outline **Discard marks**). The browser's native `beforeunload` prompt guards refresh/close.

Files:

- Route component: `apps/web/src/app/routes/pdf-viewer-route/pdf-viewer-route.tsx`
- Screen: `libs/web/features/pdf-viewer/src/lib/pdf-viewer.tsx` (`@h2-fe/pdf-viewer`)
- Top bar: `libs/web/ui/src/lib/viewer-top-bar/viewer-top-bar.tsx` (`@h2-fe/web-ui`)
- Canvas extensions: `libs/web/features/pin/src` (`@h2-fe/pin`), `libs/web/features/camera/src` (`@h2-fe/camera`)

Full source for the screen and chrome is in `layouts.md`; the full dependency tree is in `pages.md`.

`apps/web/src/app/routes/pdf-viewer-route/pdf-viewer-route.tsx` (97 lines)

```tsx
import { useCallback, useEffect, useMemo, useRef, useState } from "react"
import { useLocation, useNavigate } from "react-router-dom"

import { createCameraExtension, getCropFrameBounds } from "@h2-fe/camera"
import { isPdfPageShape, PdfViewerScreen, usePdfPages } from "@h2-fe/pdf-viewer"
import type { CanvasExtension, PdfDocumentSummary } from "@h2-fe/pdf-viewer"
import { createPinExtension } from "@h2-fe/pin"
import { Button, Flex, Modal, Text } from "@h2-fe/ui"

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
  const documentName = file?.name
  const extensions = useMemo<readonly CanvasExtension[]>(
    () => [pinExtension, createCameraExtension({ documentName })],
    [documentName]
  )

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
      <Modal
        footer={
          <Flex gap="3">
            <Button onClick={() => setConfirmExit(false)}>Keep working</Button>
            <Button
              colorPalette="red"
              onClick={() => navigate("/", { replace: true })}
              variant="outline"
            >
              Discard marks
            </Button>
          </Flex>
        }
        onOpenChange={setConfirmExit}
        open={confirmExit}
        title="Leave this document?"
      >
        <Text>Your marks aren't saved and will be lost.</Text>
      </Modal>
    </>
  )
}
```
