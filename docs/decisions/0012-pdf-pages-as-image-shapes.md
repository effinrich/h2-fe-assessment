# 0012 — PDF pages are rasterised into locked tldraw image shapes

- Status: accepted
- Date: 2026-10-04

## Context

Task 2 asks for a PDF on the canvas with the performance tradeoffs made
visible. Tasks 3 (pins between shapes) and 4 (export via `editor.toImage`,
`@tldraw/editor/dist-cjs/index.d.ts:4228`) build on top of whatever the page
is. An earlier spec draft promised a mount-once DOM element via
`getAppOwnedElement`; that was never built. This record states what was built
and why, so the spec stops claiming otherwise.

All three options use `pdfjs-dist` (worker-rendered) for parsing and raster.

## Options

**A. Raster to an image asset, place a stock locked `image` shape (chosen).**
Each visible page is rendered to an offscreen canvas, encoded as PNG, stored as
an `image` asset and shown by tldraw's own image shape. Off-screen pages are
deleted.

**B. One app-owned DOM element.** A custom shape returns a pdf.js-managed
element from `ShapeUtil.getAppOwnedElement` (`index.d.ts:7229`), released via
`onReleaseAppOwnedElement` (`:7247`). tldraw guarantees the element is never
unmounted, recreated or relocated by culling or re-renders (`:7210-7215`).

**C. A custom `PdfPageShapeUtil`.** One shape per page whose `component()`
owns a `<canvas>` and re-renders it at the current zoom.

## Tradeoffs

| Concern                     | A: image shape                                                                                                                              | B: app-owned element                                                                                     | C: custom ShapeUtil                                                                                                   |
| --------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------- |
| Memory                      | One decoded raster per _visible_ page; evicted pages freed. Data URLs also hold a base64 copy in the store.                                 | Element survives culling by design (`:7212-7213`), so per-page virtualisation must be rebuilt inside it. | Culled shapes stay in the DOM with `display: none` (`canCull`, `:6692-6698`); the util must free its canvases itself. |
| Sharpness at zoom           | Fixed scale: blurs past it, over-allocates below it. Fixable by re-rasterising per zoom bucket.                                             | Same — a CSS-transformed raster unless re-rendered on zoom.                                              | Best: can render at zoom × DPR. The util owns the scheduling.                                                         |
| Export (Task 4)             | Free: `ImageShapeUtil.toSvg` (`tldraw/dist-cjs/index.d.ts:2827`) exports the shape with its asset — but only pages currently on the canvas. | The element does not take part in `ShapeUtil.toSvg` (`:6857`); export needs a separate path.             | Needs its own `toSvg` that re-rasterises.                                                                             |
| Hit-testing / pins (Task 3) | Per-page geometry from the stock shape. **Eviction deletes the shape, and tldraw removes bindings to a deleted shape** (`:357-380`).        | One shape for the whole document; no per-page geometry.                                                  | Per-page geometry, shapes persist; best for bindings.                                                                 |
| Culling                     | We evict ourselves (stronger than tldraw's culling, which only hides).                                                                      | Opts out of culling.                                                                                     | tldraw culls; freeing is ours.                                                                                        |
| Code owned                  | No custom shape.                                                                                                                            | Custom shape plus a manual pdf.js viewer.                                                                | Custom shape, raster scheduling, export.                                                                              |

## Decision

**A.** It is the smallest design that is correct today: no custom shape, export
already works for Task 4, eviction bounds memory by the viewport, and every
store write is history-ignored so paging never enters undo.

B was rejected because its headline guarantee — never unmounted by culling — is
the opposite of what a long document needs, and it breaks export.

C is the likely destination if zoom sharpness or stable per-page bindings
become requirements; A's scheduled fixes (spec, Performance) move toward it
without a rewrite.

## Consequences

- **Sharpness is capped** by the fixed raster scale until zoom/DPR-aware
  resolution lands (scheduled in the spec).
- **Store churn:** scrolling creates and deletes shape and asset records. Each
  sync is one history-ignored `editor.run`; it must run only when the visible
  set actually changes.
- **Asset lifecycle.** A visible page's shape first shows a `src: null` asset
  (`asset:page-N-pending`, drawn by tldraw as a page-sized placeholder). Each
  landed raster is a new asset (`asset:page-N-r<seq>`); the shape is repointed
  and the old asset deleted. Updating a shown asset's `src` in place is not an
  option: tldraw shows that change only after 32+ animation frames without a
  further change, so pages arrived ~33s late at 1fps.
- **Page shapes are locked**, and tldraw silently skips locked shapes in
  `updateShapes` and `deleteShapes`; every page write runs in
  `editor.run(…, { history: "ignore", ignoreShapeLock: true })`.
- **Pins never bind to page shapes** (decided in Task 3, `task-3-pin.md` §4),
  so eviction may delete them.
- **Scroll-back re-rasterises** until a raster cache lands.
- **Revisit** if pages ever need bindings, or if zoomed-in sharpness is
  judged unacceptable before the resolution fix ships.
