# Extractable components

Superdesign init: components worth extracting as reusable design pieces. "Extractable props" lists only state and navigation inputs a design needs to vary. "Hardcoded" lists what is baked in today (copy, layout, tokens). Full source for each is in `components.md` or `layouts.md`.

## Layout components

### ViewerTopBar

- **Name:** `ViewerTopBar`
- **Source:** `libs/web/ui/src/lib/viewer-top-bar/viewer-top-bar.tsx` (`@h2-fe/web-ui`)
- **Category:** layout
- **Description:** Floating bar over the viewer canvas. Absolute, full width, `p="4"`, `zIndex 400`, click-through except its two groups. Left group: a `bg.panel` card (`borderRadius md`, `boxShadow md`, `p="2"`) with the truncated filename and the pager. Right group: colour-mode toggle and "Open another document". Wraps on narrow viewports.
- **Extractable props:** `filename?: string`, `page: number`, `totalPages: number` (0 hides the pager), `onPageChange(page)`, `onOpenAnother()`.
- **Hardcoded:** copy "Document" (filename fallback), "Previous", "Next", "of N", "Page number" (sr-only label), "Open another document". Filename `maxW="36"` with ellipsis. Page input `w="14"`, `size="sm"`, centred. Pager buttons `outline` `sm`. Main action `outline` md. `ColorModeButton` inside. Top-left/top-right placement.

### HomeScreen (home card shell)

- **Name:** `HomeScreen`
- **Source:** `apps/web/src/app/routes/home/home-screen/home-screen.tsx` (+ `types.ts`); route wrapper `apps/web/src/app/routes/home/home.tsx`
- **Category:** layout
- **Description:** The whole home page. Full-height centred `Flex` (`p={{ base: "4", md: "8" }}`) with a `ColorModeButton` absolutely positioned top-right and one card: `Stack`, `bg.panel`, 1px `border`, `borderRadius lg`, `boxShadow lg`, `maxW sm`, `p={{ base: "6", md: "8" }}`, `gap="6"`. The card has a heading block and two stacked full-width buttons.
- **Extractable props:** `isBusy?: boolean` (disables both buttons, primary label becomes "Opening"), `onFileChange(event)` (file picked), `onUseExample()`.
- **Hardcoded:** heading "Open a document" (`Heading size="lg"`), body "A PDF lands on the canvas, ready to mark up.", primary "Open PDF" (`solid`, file upload, `accept="application/pdf"`, one file), secondary "Use an example" (`outline`). Card widths/padding/radii/shadow above.

### ViewerPanel / ViewerCover (viewer state card)

- **Name:** `ViewerCover` + `ViewerPanel` (as composed in `PdfViewerScreen`)
- **Source:** `libs/web/features/pdf-viewer/src/lib/partials/viewer-chrome.tsx`; composition in `libs/web/features/pdf-viewer/src/lib/pdf-viewer.tsx` (lines 223-241)
- **Category:** layout
- **Description:** Full-canvas centring cover holding either a `lg` spinner (opening) or a card identical in look to the home card (error).
- **Extractable props:** `isLoading`, `isError`, `onRetry()`.
- **Hardcoded:** error heading "The document didn't open", body "The file may be unreadable or in an unsupported PDF dialect.", full-width solid "Try again". Card styling: `bg.panel`, `border`, `lg` radius, `lg` shadow, `maxW sm`.

## Basic components

### Button (variants)

- **Name:** `Button`
- **Source:** `libs/shared/ui/src/lib/button/button.tsx`
- **Category:** basic
- **Description:** Chakra button. Uses the global `brand` palette, so `solid` is near-black green (`brand.600` `#2a3530`) with white text. Variants: `solid` (default), `subtle`, `surface`, `outline`, `ghost`, `plain`. Sizes `2xs` to `2xl` (default `md`). Destructive buttons use `colorPalette="red"`.
- **Extractable props:** `disabled`, `loading`, `onClick`.
- **Hardcoded:** nothing beyond the Chakra recipe; variant/size/palette are picked per call site (home: solid + outline, full width; top bar: outline sm and md; leave dialog: solid + red outline).

### ColorModeButton

- **Name:** `ColorModeButton`
- **Source:** `libs/shared/ui/src/lib/color-mode-button/color-mode-button.tsx` (+ `hooks.ts`, `types.ts`)
- **Category:** basic
- **Description:** Ghost `sm` icon button that toggles light/dark through `next-themes`.
- **Extractable props:** colour mode state (`light` | `dark`) from `useColorMode()`; positioning props.
- **Hardcoded:** lucide `Sun` (light) / `Moon` (dark) icons, `variant="ghost"`, `size="sm"`, labels "Switch to dark mode" / "Switch to light mode".

### EmptyState

- **Name:** `EmptyState`
- **Source:** `libs/shared/ui/src/lib/empty-state/empty-state.tsx`
- **Category:** basic
- **Description:** Centred empty-state block: optional icon indicator, title, description, action slot. Exported from the design system; not currently used by a page.
- **Extractable props:** `title`, `description?`, `icon?`, `children` (actions).
- **Hardcoded:** centred `VStack` text alignment; Chakra empty-state recipe.

### Modal

- **Name:** `Modal`
- **Source:** `libs/shared/ui/src/lib/modal/modal.tsx`
- **Category:** basic
- **Description:** Dialog with backdrop, title, body, optional footer, and a top-right close button. In the app: "Leave this document?" confirmation on `/viewer`.
- **Extractable props:** `open`, `onOpenChange(open)`, `defaultOpen`, `trigger?`.
- **Hardcoded:** structure (header/body/footer/close), `lazyMount` + `unmountOnExit`, close button `size="sm"` with label "Close". In-app usage copy: title "Leave this document?", body "Your marks aren't saved and will be lost.", footer "Keep working" (solid) + "Discard marks" (red outline).

### Toaster

- **Name:** `Toaster` / `toaster`
- **Source:** `libs/shared/ui/src/lib/toaster/toaster.tsx`, `libs/shared/ui/src/lib/toaster/consts.ts`
- **Category:** basic
- **Description:** Global toast stack, top-end. Each toast: status indicator (or spinner for `loading`), title, description, optional action and close.
- **Extractable props:** per toast: `type` (`success` | `error` | `warning` | `info` | `loading`), `title`, `description`, `action`, `closable`.
- **Hardcoded:** placement `top-end`, `pauseOnPageIdle`, width `sm` on md+, mobile inline inset `4`, description opacity 1. In-app copy: "The example document could not be created." / "Try again, or open your own PDF." (home), plus crop export errors.

### Tooltip

- **Name:** `Tooltip`
- **Source:** `libs/shared/ui/src/lib/tooltip/tooltip.tsx`
- **Category:** basic
- **Description:** Tooltip attached to a single focusable child, optional arrow.
- **Extractable props:** `open`, `disabled`.
- **Hardcoded:** portal + positioner structure; Chakra tooltip recipe. (Canvas toolbar tooltips come from tldraw, not this component.)

### CropFrameToolbar

- **Name:** `CropFrameToolbar`
- **Source:** `libs/web/features/camera/src/lib/crop-frame-toolbar/crop-frame-toolbar.tsx`
- **Category:** basic
- **Description:** tldraw contextual toolbar floating beside a selected crop frame. Three 44×44 icon buttons: Download PNG (`ImageDown`), Copy image (`ClipboardCopy`), Download SVG (`VectorSquare`). A running action shows a `brand.fg` spinner; a finished one shows a check for 1.5s. An empty frame disables the actions (still focusable) and shows "Nothing inside" in `fg.muted` `xs`.
- **Extractable props:** frame state: `isEmpty`, `busyAction`, `doneAction`; colour mode.
- **Hardcoded:** icons (lucide, 18px, stroke 1.75), labels "Download PNG — Enter", "Copy image — ⌘/Ctrl + C", "Download SVG", toolbar label "Crop frame", sr description "⌘/Ctrl + Enter on the canvas moves focus here.", brand focus ring (2px, offset -4px, radius lg), tldraw toolbar chrome.

### FirstUseHint (camera and pin)

- **Name:** `FirstUseHint`
- **Source:** `libs/web/features/camera/src/lib/first-use-hint/first-use-hint.tsx`, `libs/web/features/pin/src/lib/first-use-hint.tsx`
- **Category:** basic
- **Description:** One-line pill centred at the top of the canvas (`top="3"`), shown once per browser session the first time a tool is used. `bg.panel`, `fg`, `px="3" py="1.5"`, `rounded="full"`, `shadow="md"`, `textStyle="sm"`, no wrap. Rendered in a live region (`<output>`).
- **Extractable props:** `isShown` (from tool state), colour mode.
- **Hardcoded:** copy: camera "Drag to frame an area to export · Esc to cancel"; pin "Click or drag to pin · Esc to cancel". Position and pill styling above. The two files are identical apart from copy and tool id.
