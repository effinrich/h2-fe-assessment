# Task 4 — camera tool

- Status: draft
- Brief reference: README.pdf §4, task-4.mp4

## What the brief asks

> "**Task 4, we need a camera tool.** Our products don't stop until the user has their data back
> to them, in formats that are familiar and universal. We want to see how you integrate different
> APIs to produce a seamless user experience. The tool should create a shape that:
>
> 1. Lets the user 'crop' a part of the canvas,
> 2. Then export that part as an image."

The brief says the tool "should create a shape". The reference creates nothing (below). We follow
the brief, and that gap is the main thing we do better. "Formats that are familiar and universal"
and "integrate different APIs" point past a single PNG download: clipboard and vector output are
the obvious other routes back to the user.

## What the demo does

Observed from the stills (`task-4.mp4`, frames f018–f054; see `docs/demos.md`). Anything marked
_inferred_ was not visible on screen.

- The toolbar's first tool is a camera icon (f018).
- Dragging draws a thin grey marquee with no fill and no handles (f021).
- On release the marquee vanishes. The tool returns to select, and the style panel opens for
  the now-empty selection (f023).
- The browser shows a download toast, "Download renamed! Screenshot from tldraw examples.png",
  with the original name `Screenshot.png` struck through and an Undo link (f028). The rename
  comes from the browser or an extension, not the app. Nothing lands on the canvas.
- A Finder window previews the download, `ss3.png`: PNG, 9 KB, 506×465, 144×144 dpi (f054). The
  canvas background is included, and the crop is exact, with no padding.

_Inferred:_ this is tldraw's `screenshot-tool` example almost unchanged. That example is a
`StateNode` with idle/pointing/dragging children, draws the box in an `InFrontOfTheCanvas`
component, and calls `exportAs` (or `copyAs` with ctrl held) on pointer-up with `bounds` set to
the box. The 144 dpi metadata and the export size are consistent with `pixelRatio: 2`, the bitmap
default (E:9676). There is no persistent shape, so there is nothing to adjust, re-export or
undo.

## What we do differently, and why

1. **A real, persistent crop-frame shape, as the brief asks.** Dragging creates a `crop-frame`
   shape. It stays on the canvas, can be moved and resized, and can be exported as many times as
   the user likes. A mis-drag in the reference means redrawing from scratch; here it means
   nudging a handle.
2. **Three ways to get the data back.** Download PNG, copy the image to the clipboard, and
   download SVG. They live in a contextual toolbar that appears beside the selected frame. The
   tool returns to select with the new frame selected, so the actions are visible immediately.
3. **The export includes the PDF.** The crop renders whatever is inside it: PDF page content
   (the locked page images), user shapes and pins, at 2× pixel ratio with the canvas background.
   The frame itself is excluded, as are any other crop frames. Off-screen PDF pages under a
   frame are kept materialised so virtualisation can't blank part of an export.
4. **A sensible filename.** `<document-name>-crop-<YYYYMMDD-HHmmss>.<ext>` replaces
   `Screenshot.png`, so a user exporting three crops of `q3-report.pdf` gets three findable
   files.
5. **Visible states.** In-flight (button busy, no double export), success (toast naming the
   file), failure (toast with the reason, and a fallback offer for clipboard failures), empty
   frame (actions disabled with a hint), and over-size frame (resolution reduced, with a toast).
   The reference has none of these.
6. **A frame that looks like a tool, not content.** Dashed border, corner marks, and a size label
   in export pixels. It's never mistaken for a rectangle, and the user knows what resolution they
   will get.

The trade-off is one extra click compared with the reference, which downloads on release. We
accept it because it buys adjust-before-export, re-export, clipboard and SVG. The toolbar
appears at the frame the user just drew, so the extra click is short.

## Decided behaviour

- **Tool.** Id `camera`, label "Camera", lucide `Camera` icon, shortcut `C` (free in tldraw's
  defaults — verified in the pin spec). Children: `idle`, `pointing`, `dragging`.
- **Drawing.** While dragging, a marquee is drawn by a `crop-marquee` `OverlayUtil` (tldraw 5's
  overlay API; canvas-rendered, so it stays correct under pan and zoom). The reference draws the
  box with a DOM `InFrontOfTheCanvas` component instead. No shape exists until release. Escape
  cancels the drag and stays in the camera tool.
- **Creation.** On release, the box is normalised (dragging in any direction works). If either
  side is under `MIN_FRAME_SCREEN_PX` (8 px on screen), nothing is created, so a plain click
  creates nothing. Otherwise: `markHistoryStoppingPoint("crop-frame")`, create the frame, select
  it, and `setCurrentTool("select")`. This always returns to select, regardless of tool lock,
  because the frame must be selected for its actions to show.
- **The frame shape.** `crop-frame`, a `BaseBoxShapeUtil` with props `{ w, h }`. It can be
  resized but not rotated (`hideRotateHandle`: export bounds are axis-aligned). It accepts no
  bindings (`canBind` false; pins never attach to it). `toSvg` returns `null`, so it never
  appears in any export, including tldraw's own "Export as" menu. `getIndicatorPath` is a
  rectangle.
- **Export.** The shapes exported are every shape on the current page whose page bounds collide
  with the frame's page bounds, minus all `crop-frame` shapes, in z-order. Options:
  `{ bounds: framePageBounds, padding: 0, background: true, pixelRatio, format }`. `padding: 0`
  is required, because the default `'auto'` trims to content and would not match the crop
  (E:9683–9691). `pixelRatio` is 2 unless either side would exceed `MAX_EXPORT_SIDE_PX` (8192),
  in which case it is scaled down to fit, and the user is told.
  - Download PNG / SVG: `exportAs(editor, ids, { ...opts, format, name })`. `exportAs` appends
    `.${format}` itself (`exportAs.mjs:18`).
  - Copy: `copyAs(editor, ids, { ...opts, format: "png" })`. It rejects when
    `navigator.clipboard` is missing.
  - Export writes nothing to the store, so it adds no history entry and doesn't count as a mark.
- **Empty frame.** If no shape collides with the frame, the actions are disabled with the hint
  "Nothing to export inside this frame". `toImage` on an empty id list has nothing to render.
- **Filename.** `buildExportFilename({ documentName, now })` (pure, in `utils.ts`) strips the
  extension, keeps `[a-z0-9._-]`, collapses the rest to `-`, lower-cases, and falls back to
  `canvas`. The result is `<base>-crop-YYYYMMDD-HHmmss`, in local time.

## Architecture

### Where the code lives

```
bunx nx g @nx/react:lib camera --directory=libs/web/features/camera --tags=scope:web,type:feature
```

```
libs/web/features/camera/src/
  index.ts                       barrel: createCameraExtension, getCropFrameBounds, CAMERA_TOOL_ID
  lib/
    consts.ts                    CAMERA_TOOL_ID "camera", CROP_FRAME "crop-frame", CAMERA_KBD "c", MIN_FRAME_SCREEN_PX, MAX_EXPORT_SIDE_PX, EXPORT_PIXEL_RATIO
    types.ts                     CropFrameShape (+ TLGlobalShapePropsMap augmentation), ExportFormat, CameraExtensionOptions
    utils.ts                     pure: normaliseBox, isBelowMinSize, exportShapeIds, exportPixelRatio, buildExportFilename
    utils.spec.ts                Vitest for the above
    crop-frame-shape-util.tsx    BaseBoxShapeUtil<CropFrameShape>: dashed frame, corner marks, size label
    camera-tool.ts               StateNode + idle/pointing/dragging children
    crop-marquee-overlay.ts      OverlayUtil drawing the in-flight box
    crop-export.ts               exportCrop / copyCrop: editor in, exportAs/copyAs out, toast reporting
    crop-frame-toolbar/
      crop-frame-toolbar.tsx     TldrawUiContextualToolbar with the three actions (InFrontOfTheCanvas slot)
      hooks.ts                   useCropExport: busy state, toasts (useToasts)
    camera-extension.ts          createCameraExtension(options) → CanvasExtension-shaped object
    camera.stories.tsx           the acceptance stories (web Storybook stage)
```

### How it plugs into the existing editor

This uses the same extension contract as the pin (see `task-3-pin.md`, Architecture).
`PdfViewerScreen` receives the extension through `extensions`; the route creates it with the
document name:
`createCameraExtension({ documentName: filename })`, memoised on `filename`.

One viewer change is camera-specific. **Pages under a crop frame must survive virtualisation.**
`syncVisiblePages` deletes page shapes outside the viewport. A frame partly off-screen would
otherwise export with blank regions, or no PDF at all. So:

- `@h2-fe/camera` exports `getCropFrameBounds(editor): Box[]`.
- `PdfViewerScreen` gains `retainPageBounds?: (editor: Editor) => Box[]`. The route passes
  `getCropFrameBounds`. In `updateVisiblePages`, the visible set becomes the pages intersecting
  the viewport ∪ the pages intersecting any retained box. Those pages are kept as shapes and
  rendered exactly like visible pages.
- `updateVisiblePages` currently listens to `scope: "session"` only. Creating, moving or resizing
  a frame is a document change, so the viewer also re-runs on document changes to `crop-frame`
  shapes.

The cost is bounded by the number of frames, and frames are drawn over content that is already
rendered.

## Verified tldraw 5.5.0 API

`E` is `node_modules/@tldraw/editor/dist-cjs/index.d.ts`, `T` is `node_modules/tldraw/dist-cjs/index.d.ts`.
Shape, binding, tool and override APIs shared with the pin are listed in `task-3-pin.md`.

| API                                                                                       | Where              |
| ----------------------------------------------------------------------------------------- | ------------------ |
| `BaseBoxShapeUtil` (`getGeometry`, `onResize`; no `getIndicatorPath`)                     | E:217–222          |
| `ShapeUtil.toSvg` (return `null` to omit from export)                                     | E:6857             |
| `ShapeUtil.hideRotateHandle` / `canBind` / `getIndicatorPath`                             | E:6759, 6644, 6598 |
| `BaseBoxShapeTool` (considered; see below)                                                | E:208              |
| `StateNode` + `static children`, `transition`                                             | E:7344, 7350, 7398 |
| `OverlayUtil`, `TLOverlay`, `TldrawEditorBaseProps.overlayUtils`                          | E:5867, 9210, 8036 |
| `TLEditorComponents.InFrontOfTheCanvas`                                                   | E:8440             |
| `editor.toImage(shapes, TLImageExportOptions)` → `{ blob, width, height }`                | E:4228             |
| `editor.getSvgString(shapes, TLSvgExportOptions)`                                         | E:4213             |
| `TLSvgExportOptions` `bounds`, `scale`, `pixelRatio`, `background`, `padding`, `darkMode` | E:9656–9702        |
| `TLImageExportOptions` `format`, `quality`                                                | E:8907             |
| `TLExportType = 'jpeg' \| 'png' \| 'svg' \| 'webp'`                                       | E:8753             |
| `exportAs(editor, ids, ExportAsOptions)`; `ExportAsOptions.name`                          | T:2112, 2118       |
| `copyAs(editor, ids, CopyAsOptions)`; `CopyAsOptions.format: TLCopyType`                  | T:836, 842, 4253   |
| `TldrawUiContextualToolbar({ getSelectionBounds, label })`                                | T:4463, 5034       |
| `TldrawUiButton`, `TldrawUiButtonIcon` (`icon: string \| TLUiIconJsx`)                    | T:4433, 4439, 4934 |
| `useToasts().addToast({ title, description, severity })`                                  | T:6241, 5686–5713  |
| `editor.getShapePageBounds` / `getCurrentPageShapesSorted`                                | E:2996, 3249       |
| `editor.getOnlySelectedShape` / `select` / `setSelectedShapes`                            | E:1967, 1886, 1864 |
| `editor.getShapeIdsInsideBounds` (bounds-only, unordered)                                 | E:3187             |
| `Box.Collides` / `Box.FromPoints` / `Box.Common`                                          | E:634, 631, 639    |
| `editor.pageToScreen` / `pageToViewport` / `getZoomLevel`                                 | E:2552, 2565, 2231 |
| `editor.getSelectionScreenBounds()`                                                       | E:1990             |

**Corrections to earlier assumptions:**

- `downloadFile` is **excluded** from tldraw's public types (T:1612). Downloads go through
  `exportAs`, which uses it internally.
- `toImage`'s `padding` defaults to `'auto'`, which **trims to content**. An exact crop needs
  `padding: 0`.
- `BaseBoxShapeTool` (E:208) gives tldraw-standard drag-to-create and snapping, but its
  click-to-create default contradicts "a click creates nothing", and it draws the shape live
  rather than a marquee. We use a custom `StateNode` instead. Recorded so the choice reads as
  deliberate.
- `getShapeIdsInsideBounds` is unordered and documented as bounds-only (E:3170–3187). Export
  order comes from `getCurrentPageShapesSorted`, filtered with `Box.Collides`.
- `TldrawUiContextualToolbar`'s `getSelectionBounds` takes **screen** coordinates. The types
  don't say (T:5034), but tldraw's own `DefaultImageToolbar` passes
  `editor.getSelectionScreenBounds()` (`DefaultImageToolbar.mjs:68`). We do the same.
- `exportAs` downloads by calling `click()` on a detached `<a download>` (`exportAs.mjs:33–39`),
  so spying on `HTMLAnchorElement.prototype.click` captures the filename.

## Acceptance criteria

Stories live in `libs/web/features/camera/src/lib/camera.stories.tsx` (title `Features/Camera`).
The harness mounts `<Tldraw>` with the camera extension and `documentName: "q3-report.pdf"`, and
seeds two geo rectangles inside (100,100)–(400,300) and one outside it. Play functions take the
editor from `tleditors.getMounted()[0]`. They spy on `editor.toImage` (`spyOn` from
`storybook/test`), capture downloads by spying on `HTMLAnchorElement.prototype.click` (reading
`download`), and stub `navigator.clipboard.write`.

- [ ] **`ToolbarEntry`** — the toolbar has a button named "Camera" containing an `svg`. Pressing
      `c` makes `getCurrentToolId()` `"camera"`. — `camera.stories.tsx`
- [ ] **`DragCreatesFrame`** — drag (100,100) → (400,300). Exactly one `crop-frame` exists, at
      x 100, y 100, w 300, h 200 (±1). The current tool is `"select"`, the frame is the only
      selected shape, and a toolbar labelled "Crop frame" shows "Download PNG", "Copy image" and
      "Download SVG". — `camera.stories.tsx`
- [ ] **`DragAnyDirection`** — drag (400,300) → (100,100) and get the same frame.
      — `camera.stories.tsx`
- [ ] **`MarqueeWhileDragging`** — mid-drag, `editor.overlays.getCurrentOverlays()` contains a
      `crop-marquee` overlay and no `crop-frame` shape exists. — `camera.stories.tsx`
- [ ] **`EscapeCancels`** — Escape mid-drag: no frame, the tool is still `"camera"`, and no
      overlay remains. — `camera.stories.tsx`
- [ ] **`ClickCreatesNothing`** — a click, or a drag under 8 screen px, creates no frame.
      — `camera.stories.tsx`
- [ ] **`DownloadPng`** — click "Download PNG". `toImage` was called once, with ids equal to the
      two inside rectangles in z-order (no `crop-frame`, not the outside rectangle) and opts
      including `bounds` equal to the frame's page bounds, `padding: 0`, `background: true`,
      `pixelRatio: 2`, `format: "png"`. The captured download name matches
      `/^q3-report-crop-\d{8}-\d{6}\.png$/`. A success toast names the file. The frame still
      exists and is still selected. — `camera.stories.tsx`
- [ ] **`ExportSizeIsTwoX`** — the resolved `toImage` value for the 300×200 frame is 600×400.
      — `camera.stories.tsx`
- [ ] **`ReExport`** — download twice: two downloads, the frame persists, and a `document`-scope
      store listener records zero changes during the exports. — `camera.stories.tsx`
- [ ] **`CopyImage`** — "Copy image" calls `navigator.clipboard.write` once with a
      `ClipboardItem` carrying `image/png`, and a "Copied image" toast appears.
      — `camera.stories.tsx`
- [ ] **`CopyUnsupported`** — with `navigator.clipboard` undefined, an error toast suggests
      "Download PNG" instead. The frame and its selection are unchanged. — `camera.stories.tsx`
- [ ] **`DownloadSvg`** — "Download SVG" produces a download name ending `.svg`, and `toImage` is
      called with `format: "svg"`. — `camera.stories.tsx`
- [ ] **`FrameNeverInExport`** — with overlapping frames F1 and F2, exporting F1 excludes both.
      tldraw's own "Export as PNG" on a selection containing a frame renders nothing for the frame
      (`toSvg` returns `null`). — `camera.stories.tsx`
- [ ] **`EmptyFrameDisabled`** — a frame over empty canvas shows all three actions disabled, with
      the hint "Nothing to export inside this frame". — `camera.stories.tsx`
- [ ] **`ResizeThenExport`** — resize the frame by its corner handle, then export. `bounds`
      equals the new page bounds. No rotate handle is rendered. — `camera.stories.tsx`
- [ ] **`ExportBusy`** — while `toImage` is pending (spy returns a held promise), the clicked
      action is disabled with `aria-busy="true"`, and a second click doesn't call `toImage`
      again. — `camera.stories.tsx`
- [ ] **`ExportFails`** — when `toImage` rejects, an error toast appears, the frame stays
      selected, and the actions are enabled again. — `camera.stories.tsx`
- [ ] **`OversizeFrame`** — a 6000×1000 frame exports with `pixelRatio` ≤ 8192/6000, and an info
      toast says the resolution was reduced. — `camera.stories.tsx`
- [ ] **`UndoCreation`** — after creating a frame, one `undo()` removes it and one `redo()`
      restores it. Exporting doesn't change `getCanUndo()`. — `camera.stories.tsx`
- [ ] **`ToolbarA11y`** — the contextual toolbar's buttons have accessible names, are reachable
      with Tab, and the addon-a11y check passes. — `camera.stories.tsx`
- [ ] **Pure helpers** — `normaliseBox` (all four drag directions), `isBelowMinSize` (zoom-aware),
      `exportShapeIds` (collision, frame exclusion, z-order preserved, empty result),
      `exportPixelRatio` (2 by default, clamped to `MAX_EXPORT_SIDE_PX`),
      `buildExportFilename` (strips `.pdf`, sanitises, `canvas` fallback, zero-padded local
      time). — `libs/web/features/camera/src/lib/utils.spec.ts`
- [ ] **Viewer: includes the PDF page** — `PdfViewerScreen` `Ready` with the camera extension.
      A frame over the example page exports ids that include `shape:page-1`, and the name starts
      with `sample-annotated-report-2026-q3-crop-`.
      — `libs/web/features/pdf-viewer/src/lib/pdf-viewer.stories.tsx`
- [ ] **Viewer: retains pages under a frame** — with `retainPageBounds={getCropFrameBounds}`, a
      frame over page 1, then the camera panned until page 1 leaves the viewport:
      `shape:page-1` still exists, and an export includes it.
      — `libs/web/features/pdf-viewer/src/lib/pdf-viewer.stories.tsx`

## States

| State    | Handled | How                                                                           |
| -------- | ------- | ----------------------------------------------------------------------------- |
| Empty    | yes     | Frame over nothing: actions disabled, with a hint                             |
| Loading  | yes     | Export in flight: clicked action busy (`aria-busy`), no double export         |
| Error    | yes     | Toast with the reason; clipboard failure suggests download; the frame is kept |
| Success  | yes     | Toast naming the file, or "Copied image"; the frame stays for re-export       |
| Disabled | yes     | Read-only editor: tool hidden; existing frames can still export               |
| Overflow | yes     | Pixel ratio clamped to `MAX_EXPORT_SIDE_PX`, with an info toast               |

## Out of scope

- **Re-rasterising the PDF at export resolution.** Pages are rasterised at scale 2
  (`openPdf(data, 2)`), so each page image's pixel size equals its page-unit size. A 2× export
  upsamples PDF content rather than adding detail; vector marks are crisp. A true high-DPI page
  export would re-render the pages through pdfjs for the crop. That's worth an ADR, not a
  default.
- **Aspect presets, Shift-to-square, Alt-from-centre.** Resize after creation covers it.
- **JPEG and WebP.** `TLExportType` supports them. PNG (lossless, universal), clipboard and SVG
  (vector) cover "familiar and universal" without an options dialog.
- **Exporting while a covered page is still rasterising.** Frames are drawn over rendered
  content, and retained pages stay rendered, so the race needs a frame drawn over a page that
  has never been on screen. Recorded under Open questions rather than built.
- **Keyboard shortcut for export.** The actions are buttons, reachable with Tab.

## Open questions

- **Export during a page render.** Should export wait for retained pages that are still
  rasterising? That needs a viewer → camera readiness signal (for example
  `retainPageBounds` returning a promise). Deferred until a test shows the race in practice.
- **The ADR 0011 amendment** for screenless feature libs is shared with Task 3.
