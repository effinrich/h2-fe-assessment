# Task 2 — display a PDF

- Status: in progress
- Brief reference: README.pdf §2, task-2.mp4

## What the brief asks

> "**Task 2, we need to display a PDF.** PDF rendering is not only our very first
> impression, but a core one throughout the app, as all user interactions happen
> on top of it. We want to see how you make tradeoffs and optimisations,
> especially in terms of performance."

The last clause is the task. Rendering a PDF is a solved problem; rendering one
_inside an infinite canvas without it being the thing that makes the canvas
slow_ is the engineering being assessed.

## What the demo does

From `docs/demos.md` — OCR of the video, so labels and sequence are reliable and
spatial detail is not:

| Time     | Observed                                                           |
| -------- | ------------------------------------------------------------------ |
| 0.0–1.0s | Empty state, two controls: **"Open PDF"** and **"Use an example"** |
| 1.5–2.0s | macOS file picker, selects `Dummy (1).pdf`                         |
| 2.5s+    | The PDF renders in the canvas                                      |

Controls while viewing: **`S` `M` `L` `XL`**, **`Export PDF`**, a **`Page 1`**
indicator. Everything else visible is stock tldraw chrome.

## What we do differently, and why

1. **Page virtualisation.** Only pages intersecting the viewport are rasterised
   and held on the canvas. A long document does not cost one raster per page.
2. **States the demo omits.** Opening, per-page loading, document failure with
   retry, per-page failure with retry. A PDF that silently fails is the worst
   first impression available.
3. **A sense of place.** Filename, "Page N of M", previous/next and a bounded
   jump field, driven by what is visible rather than by page count.
4. **Work protection.** Leaving with unsaved marks asks first; nothing claims
   the marks are persisted.

We do **not** offer Export (see Out of scope).

## Architecture (as built)

The architecture choice and its alternatives are recorded in
[ADR 0012](../decisions/0012-pdf-pages-as-image-shapes.md). In short:

- **Load.** `openPdf` (`libs/web/features/pdf-viewer/src/lib/utils.ts`) opens the
  file with `pdfjs-dist`; parsing and rendering run in the pdf.js worker
  (`utils.ts`, `GlobalWorkerOptions.workerSrc`). It then calls `getPage` for
  every page, sequentially, to learn page sizes before the screen gets a
  document. TanStack Query owns the document-level loading/error/retry
  (`hooks.ts`).
- **Raster.** A page is rendered to an offscreen `<canvas>` at a fixed scale of
  2, encoded as a PNG data URL, and the canvas is released.
- **Place.** Each visible page becomes a locked tldraw `image` shape
  (`shape:page-N`), stacked vertically with a fixed gap. Until its raster lands
  the shape shows `asset:page-N-pending`, whose `src` is `null`, so tldraw draws
  a page-sized placeholder box. A landed raster is stored under a fresh asset id
  (`asset:page-N-r<seq>`); the shape is repointed to it and the previous asset
  deleted. A shown asset's `src` is never updated in place: tldraw
  (`useImageOrVideoAsset`) shows an in-place `src` change only after more than
  32 animation frames without a further change, which delayed pages by ~33s
  when the frame rate dropped to 1fps.
- **Evict.** Pages that leave the viewport, and are not under a retained box
  (`retainPageBounds`), have their shape and every asset of that page deleted
  (`syncVisiblePages`). Unmounting the viewer or changing document runs the
  same path with no page visible. Every page write runs in one `editor.run`
  that ignores history, so paging never enters undo, and ignores the shape
  lock, because tldraw silently skips locked shapes in `updateShapes` and
  `deleteShapes`. Pins never attach to page shapes
  ([Task 3 spec](./task-3-pin.md), §4), so deleting one loses no bindings.
- **Overlays.** Per-page loading spinners and per-page retry cards are React
  elements positioned in viewport coordinates over the page's bounds.
- **Bundle.** The `/viewer` route is `React.lazy`, so tldraw, pdfjs and
  `tldraw.css` are not in the initial chunk (ADR 0011). Chunk sizes have not
  been measured or budgeted.
- **Theme.** tldraw and Chakra stay two styling systems
  ([ADR 0013](../decisions/0013-tldraw-chakra-theme-bridge.md)). Chakra owns
  our chrome (top bar, modal, overlays). tldraw keeps its built-in UI. A
  scoped wrapper maps Chakra semantic tokens onto tldraw's `--tl-color-*`
  variables after `tldraw/tldraw.css`. Color mode is synced through
  `editor.setColorMode` so a live `colorScheme` prop does not remount the
  editor.

An earlier draft of this spec claimed the document "mounts once" through
tldraw's `ShapeUtil.getAppOwnedElement`. That was a plan, never built: no code
uses `getAppOwnedElement` or overrides `canCull`. ADR 0012 records why the
raster-to-image-shape approach was taken instead.

## Acceptance criteria

Falsifiable, each with the test that proves it. Test-first: the test is written
and committed failing before the code exists.

- [x] **Given no document, the canvas offers "Open PDF" and "Use an example".**
      — `apps/web/src/app/routes/home/home-screen/home-screen.spec.tsx` (red
      `edf477a`, green `ac2b31d`); the screen lives on the home route in the
      app — see ADR 0011.
- [x] **The home screen reads as the canvas the document will land on**: the
      app header, the canvas surface, one card with both actions, and the
      three tools that make this more than a viewer (Pin `P`, Export area
      `C`, Draw `D`). — `home-screen.stories.tsx` › `Idle`.
- [x] **A PDF dropped anywhere on the home screen opens, the same as a
      picked one. Anything else (wrong type, more than one file) is refused
      with an error toast and the screen stays put.** While a file is
      dragged over, the card says so. Drops go straight to the viewer, not
      through tldraw's asset pipeline: the viewer owns PDF rasterisation
      (ADR 0012). — `home-screen.spec.tsx` › "opens a dropped PDF", "refuses
      a dropped file that is not a single PDF"; `home-screen.stories.tsx` ›
      `DropAPdf` (native drag events, real `DataTransfer`). Red `1bedc64`.
- [x] **Choosing a file places its first page as a locked image shape.** —
      placement: `pdf-viewer.spec.tsx` › `placePagesOnCanvas` › "starts with
      the first page…". Real rasterisation needs a real canvas, so pixels are
      verified by hand in the browser only.
- [x] **While the document opens, a loading state is visible.** —
      `pdf-viewer.spec.tsx` › "shows the loading state while the document
      rasterises"; `pdf-viewer.stories.tsx` › `Loading` play test.
- [x] **A visible page shows loading feedback until its raster lands.** —
      `pdf-viewer.spec.tsx` › "shows a page-sized loading indicator until its
      raster completes".
- [x] **A document-level failure shows an error with a retry that calls back.**
      — `pdf-viewer.spec.tsx` › "shows the error surface with a working retry"
      (screen level, props in). The route's `refetch` wiring is not tested.
- [x] **A failed open releases the pdf.js loading task.** —
      `pdf-viewer.spec.tsx` › "destroys the loading task when opening a
      document fails".
- [x] **A failed page retries on its own without clearing other pages,
      unmounting tldraw, or destroying the document.** — `pdf-viewer.spec.tsx`
      › "retries a failed page without reopening the document"; "keeps the
      document alive so a failed visible page can retry".
- [x] **Only pages intersecting the viewport are selected for raster.** —
      `pdf-viewer.spec.tsx` › "selects only pages intersecting the viewport"
      (100 synthetic pages, pure selector). No real 100-page PDF is tested.
- [x] **Off-screen pages release their locked shape and every asset of the
      page; pages under a retained box stay until the box goes; user marks are
      untouched.** Previously ticked against an editor stub that ignored
      tldraw's lock rule: in the real editor `deleteShapes` skipped the locked
      page shape, so nothing was evicted. The stub now applies the rule. —
      `pdf-viewer.stories.tsx` › `EvictsOffscreenPages` play test (real
      tldraw); `pdf-viewer.spec.tsx` › "releases page shapes and assets when
      they leave the viewport"; "keeps pages under a retained box after they
      leave the viewport, until the box goes"; "tracks page position, jumps
      without rasterising all pages, and preserves marks".
- [x] **A landed raster is on screen within a few animation frames of its
      render completing, whatever the frame rate.** Before: the page's asset
      `src` was updated in place, which tldraw shows only after more than 32
      frames without a further change — ~0.5s at 60fps, ~33s measured at 1fps.
      Now 1 frame. — `pdf-viewer.stories.tsx` › `RasterLandsPromptly` play
      test (fewer than 8 frames, real tldraw; red at 32); `pdf-viewer.spec.tsx`
      › "lands each raster on a fresh asset and repoints the page shape".
- [x] **Unmounting the viewer or changing document removes the previous
      document's page shapes and assets**, so the new document's pages take
      their own sizes. — `pdf-viewer.stories.tsx` › `SwitchesDocument` play
      test (real tldraw); `pdf-viewer.spec.tsx` › "replaces page shapes and
      assets when the document changes".
- [x] **Page navigation tracks the visible page and jumps without rasterising
      pages that are not visible.** — `pdf-viewer.spec.tsx` › "tracks page
      position…"; `libs/web/ui/src/lib/viewer-top-bar/viewer-top-bar.stories.tsx`
      play tests.
- [x] **PDF page shapes alone never count as unsaved marks.** —
      `pdf-viewer.spec.tsx` › "ignores PDF page shapes when checking for user
      marks".
- [x] **With unsaved marks, "Open another document" offers a cancelable
      warning; without marks it exits directly. Refresh/close prompts only while
      marked, where the browser supports it.** —
      `apps/web/src/app/routes/pdf-viewer-route.spec.tsx`.
- [x] **Filename truncation, page controls, loading and error feedback remain
      legible and keyboard-accessible at narrow widths; tldraw's own tool and
      zoom controls are not duplicated.** —
      `viewer-top-bar.stories.tsx` › `NarrowKeyboard` and
      `app-header.stories.tsx` › `Phone`, both at a 390×844 Storybook
      viewport; tldraw tools stay in the canvas toolbar, not the top bar.
      Below `md` the brand yields to the file name and "Open another
      document" shows its icon only (the accessible name is unchanged).
- [x] **Our chrome is one header row in the page flow, above the canvas.
      tldraw's container starts below it, so tldraw's menu, page panel and
      style panel keep their stock corners and nothing of ours paints on
      them.** Before: a floating pill at z-index 400 covered tldraw's
      top-left menu, and the style panel was pushed down by a 5rem padding
      hack. — `pdf-viewer.stories.tsx` › `ChromeSitsAboveCanvas` (real
      tldraw; red `45489d6`).
- [x] **Our top-bar chrome and tldraw's style panel do not share a pixel slot.
      "Open another document" stays fully readable and clickable; the style
      panel fill is opaque.** jsdom cannot prove stacking or computed panel
      alpha. — `pdf-viewer.stories.tsx` › `ChromeClearsStylePanel` (real
      tldraw; red before the offset, now held by the in-flow header above).
      Tooltip placement over the opacity
      slider is stock tldraw. `--chakra-colors-bg-panel` is already opaque
      (`#FFFFFF` / `gray.950`); the show-through was the outline button on
      the panel, not a translucent token.
- [x] **The canvas theme follows the app color mode and reads Chakra semantic
      tokens through `--app-*` → `--tl-color-*`.** tldraw's built-in UI stays
      visible (`hideUi` is not set). Shape StyleProps are not used as a token
      bridge. — `pdf-viewer.stories.tsx` › `FollowsAppColorMode`;
      `pdf-viewer.spec.tsx` › "scopes the canvas to the app color mode"
      (red `e59f932`).

Dropped: **"The renderer element is mounted exactly once across pan, zoom,
resize and reparent."** It described the `getAppOwnedElement` design that was
not built. Superseded by ADR 0012 and the Performance criteria below.

## Performance

What the viewer does about cost, what it does not yet do, and the criterion
that will prove each fix. Unchecked items are known debts, not claims.

### Done

- [x] **Virtualised raster and eviction** — criteria above.
- [x] **Rendering off the main thread** — pdf.js worker configured in
      `utils.ts`. Not separately tested.
- [x] **tldraw and pdfjs stay out of the initial chunk** — `React.lazy` route
      (ADR 0011). Not size-budgeted.

### Per-frame re-render (fixed)

- [x] **Camera or pointer changes that leave the visible-page set and overlay
      state unchanged cause no React commit in `PdfViewerScreen` and no
      `syncVisiblePages` store transaction.** Before: the viewer subscribed to
      every `session`-scoped store change — camera _and_ pointer records are
      both session-scoped — and on each one scanned every page, ran
      `syncVisiblePages` inside `editor.run`, and set overlay state to a fresh
      array, so the screen re-rendered on every pointer move. Now a tldraw
      `react` effect tracks only `editor.getViewportPageBounds()` (a computed
      over camera and screen bounds, compared by value), and the store sync,
      page indicator and overlays update only when their value changes. Each
      update still scans the page list (O(pages)); that is bounded work, not a
      commit. While a page is loading or failed, its overlay legitimately
      follows the camera every frame. — `pdf-viewer.spec.tsx` › "does not
      re-render or touch the store when the viewport moves within the same
      pages" (red before the fix: 4 commits where 3 were expected).

### Scheduled

Each becomes a red test before it becomes code.

- [ ] **Scroll-back does not re-rasterise.** A bounded raster cache keyed by
      page and resolution; a page that left and re-entered the viewport is
      shown from cache.
- [ ] **Off-screen pages keep a placeholder at their true size.** The document's
      full height is visible on the canvas before any page is rasterised, so
      zoom-to-fit and scrolling reflect the real document.
- [ ] **Raster resolution follows zoom × devicePixelRatio**, within a cap, and
      re-renders once zoom settles rather than per frame. Today scale is fixed
      at 2, so pages blur past ~2× effective zoom and over-allocate when zoomed
      out.
- [ ] **Rasters are Blob object URLs, not base64 data URLs**, and are revoked on
      eviction. Data URLs inflate size by ~⅓ and live inside store records.
- [ ] **An evicted or superseded page render is cancelled** (`RenderTask.cancel`,
      `pdfjs-dist/types/src/display/api.d.ts:1690`) **and its page resources
      released** (`PDFPageProxy.cleanup`, `api.d.ts:1572`). Today neither is
      called; a page scrolled past mid-render finishes and is discarded.
- [ ] **First page paints before every page has been measured.** Today `openPdf`
      awaits `getPage` for every page sequentially before the screen receives a
      document, so first paint scales with page count.
- [ ] **A long example document** (100+ pages) exercises all of the above in
      Storybook and by hand; the shipped example is 2 pages.
- [ ] **Camera constraints** keep the document reachable (no panning into empty
      space indefinitely). Not started; tldraw's camera options are the likely
      seam and are unverified.

## States

| State    | Handled | How                                                                                                                         |
| -------- | ------- | --------------------------------------------------------------------------------------------------------------------------- |
| Empty    | yes     | Home route: "Open PDF", "Use an example", or drop a PDF; `/viewer` with no file redirects home                              |
| Loading  | yes     | Full-surface spinner while the document opens; per-page spinner over each loading page                                      |
| Error    | yes     | Document: message + "Try again" (refetch). Page: page-sized card with "Retry page N"                                        |
| Success  | yes     | Visible pages render as locked image shapes; page indicator follows the viewport                                            |
| Disabled | yes     | Previous/next disabled at the first/last page; "Use an example" disabled while busy                                         |
| Overflow | partial | Long filenames truncate (`Ready` story). Long documents: virtualisation is unit-tested only — no 100+ page PDF has been run |

## Test strategy

jsdom cannot rasterise a PDF, so:

- **Vitest + jsdom** (`pdf-viewer.spec.tsx`): tldraw and pdf.js are stubbed;
  tests assert our behaviour — state transitions, page selection, eviction,
  retry, render counts — not pdf.js correctness.
- **Storybook play tests**: screen states and the top bar's navigation, plus
  the page lifecycle against the real tldraw editor (raster timing, eviction of
  locked shapes, document change), which a stub can only approximate.
- **By hand in a browser**: actual pixels, pan/zoom feel. Recorded as such, not
  as automated coverage.

## Out of scope

- **Export.** The demo has "Export PDF". We deliberately do not: an export that
  omits the user's annotations would be misleading, and annotation export is
  Task 4 (`editor.toImage`). It lands with annotations or not at all.
- **Deferred:** persistence of marks across refresh or browser Back (only the
  explicit exit and refresh/close are guarded; Back loses marks), page
  thumbnails, document outline, annotated-PDF export.
- **Editing the PDF's own content.** tldraw's tools sit on top; the PDF is the
  substrate.
- **Server-side rendering of pages.** No server. See ADR 0002.
- **Password-protected documents.** Named so the absence is a decision.

## Open questions

- None open. Drag-and-drop was decided: home-screen drops only (see criteria).
  Dropping a second PDF onto an open document is not supported.
