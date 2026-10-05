# Layouts

Superdesign init: the app shell and layout components, with full source.

## Shape of the app

There is **no nav bar, sidebar or footer**. The app has two screens:

- **Home (`/`)**: a single centred card on a plain page background (`Flex` full viewport height, card `maxW="sm"`, `bg.panel`, 1px `border`, `borderRadius="lg"`, `boxShadow="lg"`). A `ColorModeButton` floats in the top-right corner.
- **Viewer (`/viewer`)**: a full-bleed tldraw canvas filling the viewport (`ViewerRoot`, `100dvh`). App chrome floats over it: the `ViewerTopBar` across the top (`zIndex 400`), tldraw's own toolbar (bottom centre) and style panel (top right, pushed down 5rem so it clears the top bar), centred cover panels for loading/error, and per-page loading/error cards positioned over the pages.

Provider stack, outermost first: `StrictMode` > `UiProvider` (Chakra system + next-themes + Toaster) > `QueryClientProvider` > `BrowserRouter` > `App` (routes).

---

## `apps/web/src/main.tsx`: entry and provider stack

Mounts React into `#root` and wraps the app in the providers above. Imports `index.css` (layer order + full-height root).

`apps/web/src/main.tsx` (25 lines)

```tsx
import { QueryClient, QueryClientProvider } from "@tanstack/react-query"
import { StrictMode } from "react"
import ReactDOM from "react-dom/client"
import { BrowserRouter } from "react-router-dom"

import { UiProvider } from "@h2-fe/ui"

import App from "./app/app"
import "./index.css"

const queryClient = new QueryClient()

const root = ReactDOM.createRoot(document.getElementById("root") as HTMLElement)

root.render(
  <StrictMode>
    <UiProvider>
      <QueryClientProvider client={queryClient}>
        <BrowserRouter>
          <App />
        </BrowserRouter>
      </QueryClientProvider>
    </UiProvider>
  </StrictMode>
)
```

## `apps/web/src/app/app.tsx`: route table

`/` renders `HomeRoute` eagerly. `/viewer` lazy-loads `PdfViewerRoute` (keeps tldraw/pdfjs out of the initial bundle) behind a centred `xl` `Spinner` fallback.

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

## `libs/shared/ui/src/lib/provider/provider.tsx`: UiProvider

`ChakraProvider` with the custom `system`, `next-themes` `ThemeProvider` (class attribute, no transition on change), and the global `Toaster`.

`libs/shared/ui/src/lib/provider/provider.tsx` (24 lines)

```tsx
import type { ReactNode } from "react"

import { ChakraProvider } from "@chakra-ui/react"
import { ThemeProvider } from "next-themes"

import { system } from "../theme/system"
import { Toaster } from "../toaster/toaster"

export interface UiProviderProps {
  children: ReactNode
}

// Chakra's dark condition matches a `.dark` ancestor, so next-themes writes the
// colour mode as a class on <html>.
export function UiProvider({ children }: UiProviderProps) {
  return (
    <ChakraProvider value={system}>
      <ThemeProvider attribute="class" disableTransitionOnChange>
        {children}
        <Toaster />
      </ThemeProvider>
    </ChakraProvider>
  )
}
```

## `apps/web/src/app/routes/home/home-screen/home-screen.tsx`: home card shell

The whole home page: full-height centred `Flex`, `ColorModeButton` absolutely positioned top-right, and the card (`Stack`) with heading "Open a document", body text, a full-width solid "Open PDF" file-upload trigger and a full-width outline "Use an example" button.

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

## `apps/web/src/app/routes/pdf-viewer-route/pdf-viewer-route.tsx`: viewer route

Reads the `File` from navigation state (redirects home if missing), loads it with `usePdfPages`, and renders `PdfViewerScreen` with the pin and camera canvas extensions. Also owns the "Leave this document?" `Modal` (shown when leaving with unsaved marks) and the `beforeunload` guard.

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

## `libs/web/features/pdf-viewer/src/lib/pdf-viewer.tsx`: PdfViewerScreen

The viewer layout. The file is 277 lines (under the 400-line cut-off), so it is included in full; the returned JSX is at **lines 210-276**. It renders, inside `ViewerRoot` (with the `h2-canvas-theme` class that bridges Chakra tokens into tldraw):

1. `<Tldraw>` filling the root, with merged extension utils/tools and custom `components` (toolbar, shortcuts dialog, in-front-of-canvas slot).
2. A loading cover (`ViewerCover` + `lg` `Spinner`) or an error cover (`ViewerCover` > `ViewerPanel` with "The document didn't open" heading, explanation and a full-width solid "Try again").
3. One `PageOverlayCard` per on-screen page that is still rasterising (spinner) or failed ("Page N couldn't load." + `sm` "Retry page N").
4. `ViewerTopBar` floating on top.

`libs/web/features/pdf-viewer/src/lib/pdf-viewer.tsx` (277 lines)

```tsx
import { useCallback, useEffect, useMemo, useRef, useState, type MouseEvent } from "react"
import { react, Tldraw, unsafe__withoutCapture, type BoxModel, type Editor } from "tldraw"
import "tldraw/tldraw.css"

import "./tldraw-theme.css"

import { Button, Heading, Spinner, Stack, Text, useColorMode } from "@h2-fe/ui"
import { ViewerTopBar } from "@h2-fe/web-ui"

import type { CanvasExtension, PageOverlay, PdfViewerScreenProps, RenderedPdfPage } from "./types"

import { CANVAS_THEME_CLASS } from "./consts"
import { createCanvasComponents } from "./partials/canvas-components"
import { PageOverlayCard, ViewerCover, ViewerPanel, ViewerRoot } from "./partials/viewer-chrome"
import {
  activePageNumber,
  hasUserMarks,
  keptPageNumbers,
  mergeCanvasExtensions,
  pageBounds,
  placePagesOnCanvas,
  sameOverlays,
  samePageNumbers,
  syncVisiblePages,
  visiblePageNumbers
} from "./utils"

const NO_EXTENSIONS: readonly CanvasExtension[] = []
const NO_BOXES: readonly BoxModel[] = []

export function PdfViewerScreen({
  filename,
  onMarksChange,
  document,
  isLoading,
  isError,
  onRetry,
  onOpenAnother,
  extensions = NO_EXTENSIONS,
  retainPageBounds
}: PdfViewerScreenProps) {
  const { colorMode } = useColorMode()
  const [initialColorScheme] = useState(colorMode)
  const [editor, setEditor] = useState<Editor | null>(null)
  const retainPageBoundsRef = useRef(retainPageBounds)
  useEffect(() => {
    retainPageBoundsRef.current = retainPageBounds
  }, [retainPageBounds])
  const merged = useMemo(() => mergeCanvasExtensions(extensions), [extensions])
  const components = useMemo(() => createCanvasComponents(merged), [merged])
  const handleMount = useCallback(
    (mountedEditor: Editor) => {
      mountedEditor.setColorMode(colorMode)
      setEditor(mountedEditor)
      const teardowns = merged.onMount.map((onMount) => onMount(mountedEditor))
      return () => {
        for (const teardown of teardowns) teardown?.()
      }
    },
    [colorMode, merged]
  )
  useEffect(() => {
    editor?.setColorMode(colorMode)
  }, [colorMode, editor])
  const [page, setPage] = useState(1)
  const [overlays, setOverlays] = useState<PageOverlay[]>([])
  const retryPage = useRef<(pageNumber: number) => void>(() => {})

  useEffect(() => {
    let stop: (() => void) | undefined
    if (editor && onMarksChange) {
      const updateMarks = () => onMarksChange(hasUserMarks(editor.getCurrentPageShapes()))
      stop = editor.store.listen(updateMarks, { scope: "document" })
      updateMarks()
    }
    return () => {
      stop?.()
    }
  }, [editor, onMarksChange])

  useEffect(() => {
    if (!editor || !document || document.pages.length === 0) return () => {}
    placePagesOnCanvas(editor, document.pages)

    let active = true
    const renderedPages = new Map<number, RenderedPdfPage>()
    const renderingPages = new Set<number>()
    const failedPages = new Set<number>()
    // What React and the store were last told; an update that would repeat
    // either is skipped, so panning within the same pages costs no commit.
    let visible: number[] = []
    let retained: readonly BoxModel[] = NO_BOXES
    let shownPage: number | undefined
    let shownOverlays: PageOverlay[] | undefined

    const requestRasters = () => {
      for (const pageNumber of visible) {
        if (
          renderedPages.has(pageNumber) ||
          renderingPages.has(pageNumber) ||
          failedPages.has(pageNumber)
        )
          continue
        renderingPages.add(pageNumber)
        void document
          .renderPages([pageNumber])
          .then((pages) => {
            if (!active) return
            const rendered = pages.filter((renderedPage) =>
              visible.includes(renderedPage.pageNumber)
            )
            for (const renderedPage of rendered) {
              renderedPages.set(renderedPage.pageNumber, renderedPage)
            }
            syncVisiblePages(editor, document.pages, visible, rendered)
          })
          .catch(() => {
            if (!active) return
            failedPages.add(pageNumber)
          })
          .finally(() => {
            renderingPages.delete(pageNumber)
            if (active) update(editor.getViewportPageBounds())
          })
      }
    }

    const update = (bounds: BoxModel) => {
      if (!active) return
      const onScreen = visiblePageNumbers(document.pages, bounds)
      const nextVisible = keptPageNumbers(document.pages, bounds, retained)
      if (!samePageNumbers(nextVisible, visible)) {
        visible = nextVisible
        for (const pageNumber of renderedPages.keys()) {
          if (!visible.includes(pageNumber)) renderedPages.delete(pageNumber)
        }
        syncVisiblePages(editor, document.pages, visible, [])
      }

      const nextPage = activePageNumber(document.pages, bounds)
      if (nextPage !== shownPage) {
        shownPage = nextPage
        setPage(nextPage)
      }

      requestRasters()

      const zoom = editor.getZoomLevel()
      const nextOverlays = onScreen.flatMap((pageNumber): PageOverlay[] => {
        if (!renderingPages.has(pageNumber) && !failedPages.has(pageNumber)) return []
        const pageBox = pageBounds(document.pages, pageNumber)
        if (!pageBox) return []
        const topLeft = editor.pageToViewport({ x: pageBox.x, y: pageBox.y })
        return [
          {
            page: pageNumber,
            state: failedPages.has(pageNumber) ? "error" : "loading",
            style: {
              left: topLeft.x,
              top: topLeft.y,
              width: pageBox.w * zoom,
              height: pageBox.h * zoom
            }
          }
        ]
      })
      if (!shownOverlays || !sameOverlays(nextOverlays, shownOverlays)) {
        shownOverlays = nextOverlays
        setOverlays(nextOverlays)
      }
    }

    retryPage.current = (pageNumber) => {
      failedPages.delete(pageNumber)
      update(editor.getViewportPageBounds())
    }
    // Tracks only the viewport (camera + screen bounds) and the retained
    // boxes, never the pointer. Store reads made while syncing pages must not
    // become dependencies.
    const stopReacting = react("pdf-viewer visible pages", () => {
      const bounds = editor.getViewportPageBounds()
      const nextRetained = retainPageBoundsRef.current?.(editor) ?? NO_BOXES
      unsafe__withoutCapture(() => {
        retained = nextRetained
        update(bounds)
      })
    })
    return () => {
      active = false
      retryPage.current = () => {}
      stopReacting()
      syncVisiblePages(editor, document.pages, [], [])
      renderedPages.clear()
    }
  }, [editor, document])

  const jumpToPage = useCallback(
    (pageNumber: number) => {
      if (!editor || !document) return
      const bounds = pageBounds(document.pages, pageNumber)
      if (bounds) editor.centerOnPoint({ x: bounds.x + bounds.w / 2, y: bounds.y + bounds.h / 2 })
    },
    [editor, document]
  )

  const handleRetryPage = useCallback((event: MouseEvent<HTMLButtonElement>) => {
    retryPage.current(Number(event.currentTarget.dataset.page))
  }, [])

  return (
    <ViewerRoot className={CANVAS_THEME_CLASS} data-canvas-theme="" data-color-mode={colorMode}>
      <Tldraw
        bindingUtils={merged.bindingUtils}
        colorScheme={initialColorScheme}
        components={components}
        onMount={handleMount}
        overlayUtils={merged.overlayUtils}
        overrides={merged.overrides}
        shapeUtils={merged.shapeUtils}
        tools={merged.tools}
      />

      {isLoading ? (
        <ViewerCover aria-label="Opening the document" as="output">
          <Spinner data-testid="viewer-loading" size="lg" />
        </ViewerCover>
      ) : isError ? (
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
      ) : null}

      {overlays.map((overlay) => (
        <PageOverlayCard
          aria-label={`Page ${overlay.page} ${overlay.state === "error" ? "did not load" : "is loading"}`}
          css={{
            left: `${overlay.style.left}px`,
            top: `${overlay.style.top}px`,
            width: `${overlay.style.width}px`,
            height: `${overlay.style.height}px`
          }}
          key={overlay.page}
          role={overlay.state === "error" ? "alert" : "status"}
        >
          {overlay.state === "loading" ? (
            <Spinner aria-label={`Loading page ${overlay.page}`} />
          ) : (
            <Stack gap="2" pointerEvents="auto" textAlign="center">
              <Text>Page {overlay.page} couldn't load.</Text>
              <Button data-page={overlay.page} onClick={handleRetryPage} size="sm">
                Retry page {overlay.page}
              </Button>
            </Stack>
          )}
        </PageOverlayCard>
      ))}

      <ViewerTopBar
        filename={filename}
        onOpenAnother={onOpenAnother}
        onPageChange={jumpToPage}
        page={page}
        totalPages={document?.pages.length ?? 0}
      />
    </ViewerRoot>
  )
}
```

## `libs/web/features/pdf-viewer/src/lib/partials/viewer-chrome.tsx`: chakra() chrome factories

Styled `chakra("div")` factories used by `PdfViewerScreen`:

- `ViewerRoot`: absolute, inset 0, full width, `100dvh`: the canvas frame.
- `ViewerCover`: absolute inset-0 flex centre, for loading/error states.
- `ViewerPanel`: the centred card (same look as the home card: `bg.panel`, `border`, `lg` radius, `lg` shadow, `maxW sm`).
- `PageOverlayCard`: `bg.panel` box positioned over a page while it loads or after it fails.
- `ToolbarSlot`: `display: contents` wrapper around tldraw's toolbar and shortcuts dialog.

`libs/web/features/pdf-viewer/src/lib/partials/viewer-chrome.tsx` (58 lines)

```tsx
import { chakra } from "@h2-fe/ui"

// chakra() so viewer chrome we own participates in the app system (tokens,
// color mode). DefaultToolbar drops className, so the toolbar slot is a
// contents wrapper — tldraw internals are themed via --tl-* on this root
// (tldraw-theme.css), not by wrapping stock chrome in chakra().
export const ViewerRoot = chakra("div", {
  base: {
    h: "100dvh",
    inset: "0",
    minW: "0",
    position: "absolute",
    w: "full"
  }
})

export const ViewerCover = chakra("div", {
  base: {
    alignItems: "center",
    display: "flex",
    inset: "0",
    justifyContent: "center",
    pointerEvents: "auto",
    position: "absolute"
  }
})

export const ViewerPanel = chakra("div", {
  base: {
    bg: "bg.panel",
    borderColor: "border",
    borderRadius: "lg",
    borderWidth: "1px",
    boxShadow: "lg",
    color: "fg",
    maxW: "sm",
    p: { base: "6", md: "8" },
    pointerEvents: "auto"
  }
})

export const PageOverlayCard = chakra("div", {
  base: {
    alignItems: "center",
    bg: "bg.panel",
    color: "fg",
    display: "flex",
    justifyContent: "center",
    pointerEvents: "none",
    position: "absolute"
  }
})

export const ToolbarSlot = chakra("div", {
  base: {
    display: "contents"
  }
})
```

## `libs/web/features/pdf-viewer/src/lib/partials/canvas-components.tsx`: tldraw slots

Builds the tldraw `components` override: the stock `DefaultToolbar` with the extension tools (Pin, Export area) prepended, a "Document tools" group in the keyboard-shortcuts dialog, and the extensions' `InFrontOfTheCanvas` components (first-use hints, crop marquee, crop toolbar).

`libs/web/features/pdf-viewer/src/lib/partials/canvas-components.tsx` (72 lines)

```tsx
import {
  DefaultKeyboardShortcutsDialog,
  DefaultKeyboardShortcutsDialogContent,
  DefaultToolbar,
  DefaultToolbarContent,
  TldrawUiMenuGroup,
  TldrawUiMenuToolItem,
  ToolbarItem,
  type TLComponents,
  type TLUiKeyboardShortcutsDialogProps
} from "tldraw"

import type { MergedCanvasExtensions } from "../types"

import { DOCUMENT_TOOLS_LABEL } from "../consts"
import { ToolbarSlot } from "./viewer-chrome"

/**
 * tldraw slots for the merged extensions. Slots no extension needs stay
 * unset, so tldraw keeps its stock toolbar and dialogs.
 */
export function createCanvasComponents({
  toolIds,
  inFrontOfTheCanvas
}: Pick<MergedCanvasExtensions, "toolIds" | "inFrontOfTheCanvas">): TLComponents {
  const components: TLComponents = {}

  if (toolIds.length > 0) {
    components.Toolbar = function ViewerToolbar() {
      return (
        <ToolbarSlot>
          <DefaultToolbar>
            {toolIds.map((toolId) => (
              <ToolbarItem key={toolId} tool={toolId} />
            ))}
            <DefaultToolbarContent />
          </DefaultToolbar>
        </ToolbarSlot>
      )
    }
    components.KeyboardShortcutsDialog = function ViewerKeyboardShortcutsDialog(
      props: TLUiKeyboardShortcutsDialogProps
    ) {
      return (
        <ToolbarSlot>
          <DefaultKeyboardShortcutsDialog {...props}>
            <TldrawUiMenuGroup id="document-tools" label={DOCUMENT_TOOLS_LABEL}>
              {toolIds.map((toolId) => (
                <TldrawUiMenuToolItem key={toolId} toolId={toolId} />
              ))}
            </TldrawUiMenuGroup>
            <DefaultKeyboardShortcutsDialogContent />
          </DefaultKeyboardShortcutsDialog>
        </ToolbarSlot>
      )
    }
  }

  if (inFrontOfTheCanvas.length > 0) {
    components.InFrontOfTheCanvas = function ViewerInFrontOfTheCanvas() {
      return (
        <>
          {inFrontOfTheCanvas.map((Component, index) => (
            <Component key={index} />
          ))}
        </>
      )
    }
  }

  return components
}
```

## `libs/web/ui/src/lib/viewer-top-bar/viewer-top-bar.tsx`: ViewerTopBar

The floating top bar: a click-through absolute row (`p="4"`, `zIndex 400`) with two clickable groups. Left: a `bg.panel` / `md` radius / `md` shadow card holding the truncated filename (`maxW 36`) and the pager (outline `sm` Previous, a `w 14` centred number input, "of N", outline `sm` Next). Right, pushed with `marginLeft="auto"`: `ColorModeButton` and an outline "Open another document" button. Wraps on narrow screens.

`libs/web/ui/src/lib/viewer-top-bar/viewer-top-bar.tsx` (130 lines)

```tsx
import { useRef } from "react"

import { Button, ColorModeButton, Field, Flex, Input, Text } from "@h2-fe/ui"

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
  const pageInput = useRef<HTMLInputElement>(null)
  const jump = () => {
    const requested = Number(pageInput.current?.value)
    if (Number.isInteger(requested) && requested >= 1 && requested <= totalPages) {
      if (requested !== page) onPageChange(requested)
    } else if (pageInput.current) {
      pageInput.current.value = String(page)
    }
  }

  // Blur abandons a half-typed jump instead of performing it: clicking Next
  // blurs this field first, so committing on blur would navigate to the typed
  // page instead of the button's target.
  const abandonJump = () => {
    if (pageInput.current) pageInput.current.value = String(page)
  }

  return (
    <Flex
      align="start"
      gap="2"
      flexWrap="wrap"
      left="0"
      p="4"
      pointerEvents="none"
      position="absolute"
      right="0"
      top="0"
      zIndex={400}
    >
      <Flex
        align="center"
        bg="bg.panel"
        borderRadius="md"
        boxShadow="md"
        color="fg"
        flexWrap="wrap"
        gap="2"
        maxW="full"
        p="2"
        pointerEvents="auto"
      >
        <Text
          fontSize="sm"
          maxW="36"
          overflow="hidden"
          textOverflow="ellipsis"
          title={filename}
          whiteSpace="nowrap"
        >
          {filename ?? "Document"}
        </Text>
        {totalPages > 0 && (
          <Flex align="center" gap="1">
            <Button
              aria-label="Previous page"
              disabled={page <= 1}
              onClick={() => onPageChange(page - 1)}
              size="sm"
              variant="outline"
            >
              Previous
            </Button>
            <form
              onSubmit={(event) => {
                event.preventDefault()
                jump()
              }}
            >
              <Field.Root>
                <Field.Label srOnly>Page number</Field.Label>
                <Input
                  aria-label="Page number"
                  defaultValue={page}
                  inputMode="numeric"
                  key={page}
                  max={totalPages}
                  min={1}
                  onBlur={abandonJump}
                  ref={pageInput}
                  size="sm"
                  textAlign="center"
                  type="number"
                  w="14"
                />
              </Field.Root>
            </form>
            <Text fontSize="sm" whiteSpace="nowrap">
              of {totalPages}
            </Text>
            <Button
              aria-label="Next page"
              disabled={page >= totalPages}
              onClick={() => onPageChange(page + 1)}
              size="sm"
              variant="outline"
            >
              Next
            </Button>
          </Flex>
        )}
      </Flex>
      <Flex flexShrink="0" gap="2" marginLeft="auto" pointerEvents="auto" whiteSpace="nowrap">
        <ColorModeButton />
        <Button onClick={onOpenAnother} variant="outline">
          Open another document
        </Button>
      </Flex>
    </Flex>
  )
}
```
