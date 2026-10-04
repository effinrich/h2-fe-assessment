# Task 4 — camera tool

- Status: in progress
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
   With the frame selected, Enter downloads the PNG and Ctrl/Cmd+C copies the image, so the
   common case needs no pointer travel at all.
3. **The export includes the PDF.** The crop renders whatever is inside it: PDF page content
   (the locked page images), user shapes and pins, at up to 2× pixel ratio with the canvas
   background, always in light mode. The frame itself is excluded, as are any other crop
   frames. Off-screen PDF pages under a frame are kept materialised so virtualisation can't
   blank part of an export.
4. **A sensible filename.** `<document-name>-crop-<YYYYMMDD-HHmmss>.<ext>` replaces
   `Screenshot.png`, so a user exporting three crops of `q3-report.pdf` gets three findable
   files.
5. **Visible states.** In-flight (button busy, no double export), done (a check mark on the
   button), success (toast naming the file), failure (toast with the reason, and a fallback offer
   for clipboard failures), empty frame (actions disabled with a hint), and over-size frame
   (resolution reduced, with a toast). The reference has none of these.
6. **A frame that looks like a tool, not content.** Dashed border, corner marks, and a size label
   in exported pixels ("600 × 400 PNG"). The marquee is drawn the same way while dragging, with
   a live size readout. It's never mistaken for a rectangle, and the user knows what resolution
   they will get before letting go.
7. **Keyboard all the way.** Pressing the tool again (or Enter in the tool) drops a default frame
   in the middle of the view; Ctrl/Cmd+Enter reaches the frame's actions; Enter and Ctrl/Cmd+C
   export. Keyboard-triggered exports keep focus where it was.

The trade-off is one extra click compared with the reference, which downloads on release. We
accept it because it buys adjust-before-export, re-export, clipboard and SVG. The toolbar
appears at the frame the user just drew, so the extra click is short, and Enter makes it a key
press.

## Decided behaviour

- **Tool.** Id `camera`, label "Export area" (a verb, so the tooltip says what it does), lucide
  `Camera` icon, shortcut `C` (free in tldraw's defaults — verified in the pin spec). Accessible
  name and tooltip "Export area — C". Children: `idle`, `pointing`, `dragging`.
- **First use.** The first time the tool is entered in a browser session, a one-line hint
  ("Drag to frame an area to export · Esc to cancel", in an always-mounted `<output>`, which is
  role `status`) shows at the top centre of
  the canvas. It hides when a drag starts or the tool is left, and doesn't come back until the
  next session (`sessionStorage`; if storage is unavailable, it shows every time).
- **Drawing.** While dragging, the marquee looks like the final frame: brand dashed border,
  corner marks, and a live "W × H" readout of the exported pixel size. It is a DOM element in the
  `InFrontOfTheCanvas` slot, positioned from the page-space box through `pageToViewport`, so it
  tracks pan and zoom. No shape exists until release. Escape cancels the drag and stays in the
  camera tool. Dragging near the viewport edge scrolls the canvas (tldraw's
  `edgeScrollManager`, ticked from the dragging state), and the marquee follows.
- **Creation.** On release, the box is normalised (dragging in any direction works). If either
  side is under `MIN_FRAME_SCREEN_PX` (16 px on screen), nothing is created, so a plain click or
  a twitch creates nothing. Otherwise: `markHistoryStoppingPoint("crop-frame")`, create the frame,
  select it, and `setCurrentTool("select")`. This always returns to select, regardless of tool
  lock, because the frame must be selected for its actions to show.
- **Keyboard creation.** Activating the tool while it is already active and idle (pressing `C`
  again, or the toolbar button again), or pressing Enter in the tool's idle state, drops a frame
  300×200 screen px (capped at 80% of the viewport), centred in the viewport, through the same
  creation path (history stop, select, back to select).
- **Stacking.** A new frame is inserted just above the background and below the user's marks:
  directly under the lowest page child that is neither locked nor a crop frame. Locked shapes are
  the background (the viewer's PDF pages are locked images; the pin uses the same rule). With no
  such mark, the frame goes on top.
- **The frame shape.** `crop-frame`, a `BaseBoxShapeUtil` with props `{ w, h }`
  (`T.nonZeroFiniteNumber`). Its geometry is **filled**, so a click anywhere inside selects it;
  marks above it stay clickable because the frame sits below them. It can be resized but never
  rotated: `hideRotateHandle`, and `onBeforeUpdate` forces `rotation` back to 0 at the previous
  `x`/`y` (export bounds are axis-aligned). It accepts no bindings (`canBind` false; pins never
  attach to it). `toSvg` returns `null`, so it is never drawn in any export. tldraw still unions
  a null-drawing shape's bounds into the default export bounds (`getExportDefaultBounds`), so the
  extension overrides tldraw's `export-as-*`, `export-all-as-*` and `copy-as-svg|png` actions to
  leave crop frames out of their ids (otherwise the same as tldraw's: selection or whole page,
  same name rule). Called directly with a frame id, the editor API (`getSvgString`, `toImage`)
  still grows the bounds to include it; nothing in the app does that. `getIndicatorPath` is a rectangle. `isCropFrameShape(shape)` is the public
  predicate for "is this a crop frame" (the viewer uses it to tell crop frames from marks).
- **Frame chrome.** The dashed border is `brand.fg`. The corner marks are `brand.solid` in light
  mode and `brand.fg` in dark mode (indigo-300-level contrast on the dark canvas). While the frame
  is selected, the corner marks hide (tldraw's selection handles take the corners) and the label
  turns neutral (`fg` on `bg` inverted) so it doesn't clash with the blue selection box. The label
  ("600 × 400 PNG", the exported pixel size) sits below the frame and shows when the frame is
  selected or hovered, or when the frame is wide enough on screen to hold it. All chrome follows
  tldraw's colour mode, not the app's.
- **Style panel.** Hidden while the selection (in the select tool) is only crop frames: they have
  no styles, and tldraw would otherwise show an opacity-only panel (`useRelevantStyles` returns
  an empty, truthy style map for any selection). The extension contract has no `StylePanel`
  component slot, so the camera sets `data-crop-only-selection` on the editor container and one
  deduplicated stylesheet hides `.tlui-style-panel` under it. A `components` slot on
  `CanvasExtension` would let it swap the panel instead (a viewer change, out of this lib).
- **Export.** The shapes exported are every shape on the current page whose masked page bounds
  (`getShapeMaskedPageBounds`, so children clipped by a tldraw frame count only where visible)
  overlap the frame's page bounds expanded by `EXPORT_EDGE_SLOP` (4 page units, so a stroke that
  pokes into the crop is kept), minus all `crop-frame` shapes, in z-order. Options:
  `{ bounds: framePageBounds, padding: 0, background: true, darkMode: false, format }`, plus
  `pixelRatio` for PNG only (SVG is vector; tldraw ignores the ratio for it). `padding: 0` keeps
  the exact crop: with explicit `bounds`, tldraw 5.5.0 doesn't trim under `'auto'`, but it would
  expand the bounds by the default padding under any number other than 0 (`getSvgJsx.mjs:46`).
  `darkMode: false` because an exported image goes into documents and chats, not back onto this
  canvas (`getSvgJsx.mjs:37` otherwise follows the editor's colour mode).
  - **Pixel ratio:** `min(2, 8192 / longestSide, sqrt(4096² / (w × h)))`: 2× unless a side would
    pass `MAX_EXPORT_SIDE_PX` (8192) or the area would pass `MAX_EXPORT_AREA_PX` (4096², the
    smallest common browser canvas-area limit). When reduced, the user is told the size they got.
  - Download PNG / SVG: `exportAs(editor, ids, { ...opts, format, name })`. `exportAs` appends
    `.${format}` itself (`exportAs.mjs:18`).
  - Copy: `copyAs(editor, ids, { ...opts, format: "png" })`. Before calling it, we check that the
    clipboard can take images (`ClipboardItem` and `navigator.clipboard.write` exist); if not, an
    error toast offers "Download PNG" instead. A rejected write (for example a `NotAllowedError`)
    gets the same offer, with the reason.
  - Export writes nothing to the store, so it adds no history entry and doesn't count as a mark.
- **One export at a time, per editor.** The busy state lives with the editor (a `WeakMap`), not
  the toolbar, so deselecting and reselecting mid-export still shows the busy button and refuses a
  second export. It is cleared in `finally`, so even an unexpected failure can't leave the actions
  stuck. After success, the button shows a check mark for `ACTION_DONE_MS` (1.5 s).
- **Focus.** tldraw's export focuses `document.body` (`getSvgJsx.mjs:61`). When an export ends
  with focus on the body, it goes back to the element that had it when the export started (the
  toolbar button, or the canvas).
- **Keyboard.**
  - Ctrl/Cmd+Enter on the canvas (tldraw's "adjust shape styles") moves focus into the frame's
    toolbar, on "Download PNG", instead of opening the style panel. It stays available read-only.
    Tab is taken by tldraw while shapes are selected (it cycles the selection), so this is the
    way in. Inside the toolbar there is one Tab stop and arrows move between actions.
  - With only a crop frame selected and the select tool idle, Enter (no modifiers) downloads the
    PNG and Ctrl/Cmd+C copies the image (a capture-phase `copy` listener runs ahead of tldraw's,
    which would otherwise copy the frame shape itself). The menu's "Copy" still copies the frame
    shape, so it can be pasted.
  - The toolbar's accessible description says Ctrl/Cmd+Enter reaches it ("Ctrl + Enter on the
    canvas moves focus here.", ⌘ on macOS). `TldrawUiContextualToolbar` doesn't forward
    `aria-describedby`, so a hidden element inside the toolbar sets it. Each action's
    accessible name and tooltip carry its key: "Download PNG — Enter", "Copy image — Ctrl + C"
    (⌘ on macOS), "Download SVG".
- **Toolbar placement.** Centred above the frame. When there is no room above (the frame's top
  is within toolbar height + 8 px gap + 16 px margin of the viewport top) and there is room below,
  it anchors below the frame and its size label instead.
- **Empty frame.** If no shape overlaps the frame, the actions are disabled (`aria-disabled`, so
  they stay focusable) and the hint "Nothing inside" is their accessible description.
- **Announcement.** Selecting a frame is announced by tldraw's live region as "Exports at
  600 × 400 px, Crop frame. 1 of 1" (`getAriaDescriptor` plus a `tool.crop-frame` translation,
  registered for every tldraw locale so non-English UIs don't read the raw key).
- **Toasts.** Through the app's toaster (`toaster` from `@h2-fe/ui`), not tldraw's
  `useToasts`, so they look like the rest of the app. Success, info, and error map to the toast
  `type`. A subtle style and a narrow-viewport placement that clears tldraw's bottom toolbar need
  shared-ui changes; they are recommended there, not patched from this lib.
- **Filename.** `buildExportFilename({ documentName, now })` (pure, in `utils.ts`) strips the
  extension, folds accents (`é` → `e`), lower-cases, keeps `[a-z0-9._-]`, collapses the rest to
  `-`, caps the base at 100 characters, and falls back to `canvas`. The result is
  `<base>-crop-YYYYMMDD-HHmmss`, in local time.

## Architecture

### Where the code lives

```
bunx nx g @nx/react:lib camera --directory=libs/web/features/camera --tags=scope:web,type:feature
```

```
libs/web/features/camera/src/
  index.ts                       barrel: createCameraExtension, getCropFrameBounds, isCropFrameShape, CAMERA_TOOL_ID, public types
  lib/
    consts.ts                    ids, labels, sizes and limits
    types.ts                     CropFrameShape (+ TLGlobalShapePropsMap augmentation), CameraExtension(Options), internal types
    utils.ts                     pure: normaliseBox, isBelowMinSize, frameInsertIndex, cropToolbarAnchor, defaultFrameBox, exportShapeIds, exportPixelRatio, exportPixelSize, buildExportFilename, isCropFrameShape
    utils.spec.ts                Vitest for the above
    crop-frame-outline.tsx       the frame's dashed border, corner marks and label, shared by the shape and the marquee
    crop-frame-shape-util.tsx    BaseBoxShapeUtil<CropFrameShape>
    camera-tool.ts               StateNode + idle/pointing/dragging children, default-frame drop
    crop-marquee.tsx             the in-flight box (InFrontOfTheCanvas)
    first-use-hint.tsx           the once-per-session hint (InFrontOfTheCanvas)
    style-panel-guard.tsx        hides the style panel for crop-only selections (InFrontOfTheCanvas)
    crop-export.ts               export plan, exportAs/copyAs, toast reporting
    crop-action-state.ts         per-editor busy/done state, focus restore
    crop-shortcuts.ts            Enter / Ctrl+C while a frame is selected
    export-actions.ts            tldraw's export/copy actions minus crop frames (overrides.actions)
    crop-frame-toolbar/
      crop-frame-toolbar.tsx     TldrawUiContextualToolbar with the three actions (InFrontOfTheCanvas slot)
      hooks.ts                   toolbar target, empty state, placement
    camera-extension.tsx         createCameraExtension(options) → CanvasExtension-shaped object; getCropFrameBounds
    camera.stories.tsx           the acceptance stories (web Storybook stage)
```

### How it plugs into the existing editor

This uses the same extension contract as the pin (see `task-3-pin.md`, Architecture).
`PdfViewerScreen` receives the extension through `extensions`; the route creates it with the
document name:
`createCameraExtension({ documentName: filename })`, memoised on `filename`. The extension has no
`overlayUtils`; everything it draws is a shape or an `InFrontOfTheCanvas` element.

One viewer change is camera-specific. **Pages under a crop frame must survive virtualisation.**
`syncVisiblePages` deletes page shapes outside the viewport. A frame partly off-screen would
otherwise export with blank regions, or no PDF at all. So:

- `@h2-fe/camera` exports `getCropFrameBounds(editor): Box[]`. It reads through one cached
  `computed` per editor (a `WeakMap`), built on a store query for `crop-frame` records, with an
  `isEqual` on the box arrays. A reactive caller re-runs when a frame on the current page is
  added, moved, resized or removed, and not when an unrelated shape changes.
- `PdfViewerScreen` gains `retainPageBounds?: (editor: Editor) => Box[]`. The route passes
  `getCropFrameBounds`. In `updateVisiblePages`, the visible set becomes the pages intersecting
  the viewport ∪ the pages intersecting any retained box. Those pages are kept as shapes and
  rendered exactly like visible pages.

The cost is bounded by the number of frames, and frames are drawn over content that is already
rendered.

## Verified tldraw 5.5.0 API

`E` is `node_modules/@tldraw/editor/dist-cjs/index.d.ts`, `T` is `node_modules/tldraw/dist-cjs/index.d.ts`,
`S` is `@tldraw/state`, `U` is `@tldraw/utils`, `V` is `@tldraw/validate`, `ST` is `@tldraw/store`
(each `dist-cjs/index.d.ts`). Shape, binding, tool and override APIs shared with the pin are
listed in `task-3-pin.md`.

| API                                                                                       | Where                    |
| ----------------------------------------------------------------------------------------- | ------------------------ |
| `BaseBoxShapeUtil` (`getGeometry`, `onResize`; no `getIndicatorPath`)                     | E:217–222                |
| `ShapeUtil.toSvg` (return `null` to omit from export)                                     | E:6857                   |
| `ShapeUtil.hideRotateHandle` / `canBind` / `getIndicatorPath`                             | E:6759, 6644, 6598       |
| `ShapeUtil.onBeforeUpdate(prev, next)` → `Shape \| void`                                  | E:6956                   |
| `ShapeUtil.getAriaDescriptor`                                                             | E:6896                   |
| `Rectangle2d({ width, height, isFilled })`                                                | E:6180                   |
| `T.nonZeroFiniteNumber`                                                                   | V:337                    |
| `BaseBoxShapeTool` (considered; see below)                                                | E:208                    |
| `StateNode` + `static children`, `transition`, `onTick`, `onKeyDown`                      | E:7344, 7350, 7435       |
| `editor.edgeScrollManager.updateEdgeScrolling(elapsed)`                                   | E:1333, 1173             |
| `TLEditorComponents.InFrontOfTheCanvas`                                                   | E:8440                   |
| `editor.on("before-event", (info: TLEventInfo) => …)` (emitted before the state chart)    | E:8709                   |
| `TLKeyboardEventInfo` (`key`, `name`, `ctrlKey`, `metaKey`, `altKey`, `shiftKey`)         | E:8975                   |
| `editor.toImage(shapes, TLImageExportOptions)` → `{ blob, width, height }`                | E:4228                   |
| `editor.getSvgString(shapes, TLSvgExportOptions)`                                         | E:4213                   |
| `TLSvgExportOptions` `bounds`, `scale`, `pixelRatio`, `background`, `padding`, `darkMode` | E:9656–9702              |
| `TLImageExportOptions` `format`, `quality`                                                | E:8907                   |
| `exportAs(editor, ids, ExportAsOptions)`; `ExportAsOptions.name`                          | T:2112, 2118             |
| `copyAs(editor, ids, CopyAsOptions)`; `CopyAsOptions.format: TLCopyType`                  | T:836, 842, 4253         |
| `TldrawUiContextualToolbar({ getSelectionBounds, label })`                                | T:4463, 5034             |
| `TldrawUiToolbarButton` (`title` → `aria-label`, `tooltip: string`)                       | T:4676, 5722             |
| `TldrawUiButtonIcon` (`icon: string \| TLUiIconJsx`)                                      | T:4439, 4934             |
| `TLUiOverrides.translations`; `LANGUAGES` (`@tldraw/tlschema`, re-exported)               | T:5562; 2504             |
| `editor.getShapePageBounds` / `getShapeMaskedPageBounds` / `getCurrentPageShapesSorted`   | E:2996, 3045, 3249       |
| `editor.getSortedChildIdsForParent` / `isShapeOrAncestorLocked` / `rotateShapesBy`        | E:3383, 3101, 3518       |
| `editor.getAncestorPageId` / `getCurrentPageId`                                           | E:3341, 2716             |
| `getIndexBetween(below, above)`                                                           | U:630                    |
| `editor.getOnlySelectedShape` / `select` / `selectNone` / `getHoveredShapeId`             | E:1967, 1886, 1949, 2102 |
| `editor.getSelectionScreenBounds()` / `getViewportScreenBounds` / `pageToViewport`        | E:1990, 2514, 2565       |
| `Box.Equals(a, b)`                                                                        | E:647                    |
| `editor.store.query.records(typeName, () => QueryExpression)`                             | ST:2232                  |
| `computed(name, fn, { isEqual })`, `react`, `atom`                                        | S:174, 322, 579, 51      |
| `tlenv.isDarwin`                                                                          | E:8619–8623              |

**Corrections to earlier assumptions:**

- `downloadFile` is **excluded** from tldraw's public types (T:1612). Downloads go through
  `exportAs`, which uses it internally.
- With explicit `bounds`, `padding: 'auto'` does **not** trim in 5.5.0 (`getSvgJsx.mjs:46`:
  `isAutoTrim ? bounds.clone() : bounds.expandBy(padding)`). We pass `padding: 0` so the crop
  stays exact whatever the default padding.
- `BaseBoxShapeTool` (E:208) gives tldraw-standard drag-to-create and snapping, but its
  click-to-create default contradicts "a click creates nothing", and it draws the shape live
  rather than a marquee. We use a custom `StateNode` instead. Recorded so the choice reads as
  deliberate.
- `getShapeIdsInsideBounds` is unordered and documented as bounds-only (E:3170–3187). Export
  order comes from `getCurrentPageShapesSorted`, filtered by overlap.
- `TldrawUiContextualToolbar`'s `getSelectionBounds` takes **screen** coordinates. The types
  don't say (T:5034), but tldraw's own `DefaultImageToolbar` passes
  `editor.getSelectionScreenBounds()` (`DefaultImageToolbar.mjs:68`). The toolbar is placed at
  `y = bounds.y − height − 8`, clamped to a 16 px margin (`TldrawUiContextualToolbar.mjs`), so
  anchoring it below the frame means handing it a zero-height box below the label.
- tldraw only dispatches canvas key events when focus isn't on a button or input
  (`useDocumentEvents.mjs`, `areShortcutsDisabled`), so Enter on a focused toolbar button clicks
  it and never reaches the frame's Enter shortcut. Copy and paste come from native document
  events (`useClipboardEvents.mjs`), not the shortcut table.
- `exportAs` downloads by calling `click()` on a detached `<a download>` (`exportAs.mjs:33–39`),
  so spying on `HTMLAnchorElement.prototype.click` captures the filename.

## Acceptance criteria

Stories live in `libs/web/features/camera/src/lib/camera.stories.tsx` (title `Features/Camera`).
The harness mounts `<Tldraw>` with the camera extension and `documentName: "q3-report.pdf"`, and
seeds two geo rectangles inside (100,100)–(400,300) and one outside it. Play functions take the
editor from `tleditors.getMounted()`. They spy on `editor.toImage` (`spyOn` from
`storybook/test`), capture downloads by spying on `HTMLAnchorElement.prototype.click` (reading
`download`), and stub `navigator.clipboard.write`. Toast assertions check the toast root's
`data-type` as well as its text. Each story starts with the first-use hint unseen.

### Creating and drawing

- [x] **`ToolbarEntry`** — the toolbar has a button named "Export area — C" containing an `svg`.
      Pressing `c` makes `getCurrentToolId()` `"camera"`. — `camera.stories.tsx`
- [x] **`FirstUseHint`** — entering the tool shows "Drag to frame an area to export · Esc to
      cancel" as a status; Escape (back to select) hides it; entering the tool again doesn't show
      it. — `camera.stories.tsx`
- [x] **`DragCreatesFrame`** — drag (100,100) → (400,300). Exactly one `crop-frame` exists, at
      x 100, y 100, w 300, h 200 (±1). The current tool is `"select"`, the frame is the only
      selected shape, and a toolbar labelled "Crop frame" shows the three actions.
      — `camera.stories.tsx`
- [x] **`FrameLabel`** — the selected frame's label reads "600 × 400 PNG" (exported pixels).
      — `camera.stories.tsx`
- [x] **`DragAnyDirection`** — drag (400,300) → (100,100) and get the same frame.
      — `camera.stories.tsx`
- [x] **`MarqueeWhileDragging`** — mid-drag, a marquee element is visible with corner marks and
      the readout "600 × 400", and no `crop-frame` shape exists. — `camera.stories.tsx`
- [x] **`EscapeCancels`** — Escape mid-drag: no frame, the tool is still `"camera"`, and no
      marquee remains. — `camera.stories.tsx`
- [x] **`ClickCreatesNothing`** — a click, or a drag under 16 screen px, creates no frame.
      — `camera.stories.tsx`
- [ ] **`EdgeScrollWhileDragging`** — holding a drag near the viewport's right edge moves the
      camera, and the marquee grows with it. — `camera.stories.tsx`
- [x] **`KeyboardCreatesFrame`** — with the canvas focused, `c` then Enter creates one 300×200
      frame (at zoom 1) centred in the viewport, selected, with the select tool current; `c`
      twice does the same. — `camera.stories.tsx`
- [x] **`UndoCreation`** — after creating a frame, one `undo()` removes it and one `redo()`
      restores it. Exporting doesn't change `getCanUndo()`. — `camera.stories.tsx`

### The frame

- [x] **`ClickInsideSelects`** — over a locked background shape, a new frame is stacked above the
      background and below every seeded mark; with nothing selected, a click on empty space
      inside the frame selects it. — `camera.stories.tsx`
- [x] **`MarkInsideFrameSelectable`** — a click on a mark inside the frame selects the mark.
      — `camera.stories.tsx`
- [x] **`NeverRotates`** — `editor.rotateShapesBy([frame.id], Math.PI / 6)` leaves rotation 0
      and x/y unchanged. — `camera.stories.tsx`
- [x] **`LabelVisibility`** — a frame wide enough for its label shows it, with the corner marks.
      A frame too narrow for its label hides the label until it is hovered or selected.
      Selected, the corner marks are hidden and the label is neutral (background `fg`, text
      `bg`). — `camera.stories.tsx`
- [x] **`StylePanelHidden`** — with only a crop frame selected, tldraw's style panel is not
      shown; selecting a rectangle, or the frame plus a rectangle, brings it back.
      — `camera.stories.tsx`
- [ ] **`FollowsCanvasColorMode`** — with tldraw in dark mode (app light), the frame and toolbar
      carry the `dark` class, the corner marks use the same colour as the dashed border
      (`brand.fg`), and an export is still requested with `darkMode: false`.
      — `camera.stories.tsx`

### Export

- [x] **`DownloadPng`** — click "Download PNG — Enter". `toImage` was called once, with ids equal
      to the two inside rectangles in z-order (no `crop-frame`, not the outside rectangle) and
      opts including `bounds` equal to the frame's page bounds, `padding: 0`,
      `background: true`, `darkMode: false`, `pixelRatio: 2`, `format: "png"`. The captured
      download name matches `/^q3-report-crop-\d{8}-\d{6}\.png$/`. A `success` toast names the
      file. The frame still exists and is still selected. — `camera.stories.tsx`
- [x] **`ExportSizeIsTwoX`** — the PNG produced for the 300×200 frame is 600×400 pixels
      (decoded with `createImageBitmap`; `toImage`'s own `width`/`height` are logical).
      — `camera.stories.tsx`
- [x] **`ReExport`** — download twice: two downloads, the frame persists, and a `document`-scope
      store listener records zero changes during the exports. — `camera.stories.tsx`
- [x] **`CopyImage`** — "Copy image" calls `navigator.clipboard.write` once with a
      `ClipboardItem` carrying `image/png`, and a "Copied image" toast appears.
      — `camera.stories.tsx`
- [x] **`CopyUnsupported`** — with `navigator.clipboard` undefined, an `error` toast suggests
      "Download PNG" instead, and its action downloads. The frame and its selection are
      unchanged. — `camera.stories.tsx`
- [x] **`CopyFails`** — when `clipboard.write` rejects with a `NotAllowedError` `DOMException`,
      an `error` toast "Couldn't copy the image" appears and its "Download PNG" action downloads.
      — `camera.stories.tsx`
- [x] **`DownloadSvg`** — "Download SVG" produces a download name ending `.svg`, and `toImage` is
      called with `format: "svg"` and no `pixelRatio`. — `camera.stories.tsx`
- [x] **`FrameNeverInExport`** — with overlapping frames F1 and F2, exporting F1 excludes both.
      tldraw's SVG of `[shape, F1, F2]` draws exactly what `[shape]` draws. With `[shape, F1, F2]`
      selected, tldraw's "Copy as PNG" (Ctrl+Shift+C) renders `[shape]` only.
      — `camera.stories.tsx`
- [ ] **`ClippedChildExcluded`** — a child of a tldraw frame whose only overlap with the crop is
      clipped away by its parent is not exported. — `camera.stories.tsx`
- [x] **`ToolbarFlipsBelow`** — with room above, the toolbar sits above the frame. Moved so its
      top is 10 px below the viewport top, the frame gets its toolbar below its size label,
      overlapping neither. — `camera.stories.tsx`
- [x] **`EmptyFrameDisabled`** — a frame over empty canvas shows all three actions disabled,
      described by the hint "Nothing inside"; clicking doesn't export. — `camera.stories.tsx`
- [x] **`ResizeThenExport`** — resize the frame by its corner handle, then export. `bounds`
      equals the new page bounds. The selection has a `selection_fg:bottom_right` resize handle
      and no handle whose id contains "rotate". — `camera.stories.tsx`
- [x] **`ExportBusy`** — while `toImage` is pending (spy returns a held promise), the clicked
      action is disabled with `aria-busy="true"`, and a second click doesn't call `toImage`
      again. — `camera.stories.tsx`
- [x] **`BusySurvivesReselect`** — deselecting and reselecting the frame mid-export still shows
      the busy action and refuses a second export. — `camera.stories.tsx`
- [x] **`BusyResetsAfterUnexpectedFailure`** — if reporting a failed export itself throws, the
      actions are enabled again. — `camera.stories.tsx`
- [x] **`ExportFails`** — when `toImage` rejects, an `error` toast appears, the frame stays
      selected, and the actions are enabled again. — `camera.stories.tsx`
- [x] **`OversizeFrame`** — a 6000×1000 frame exports with `pixelRatio` ≤ 8192/6000, and an info
      toast gives the reduced size. — `camera.stories.tsx`

### Keyboard and accessibility

- [ ] **`ToolbarA11y`** — the actions are named "Download PNG — Enter", "Copy image — Ctrl + C"
      (⌘ on macOS) and "Download SVG"; the toolbar's description mentions Ctrl+Enter; selecting
      the frame is announced as "Exports at 600 × 400 px, Crop frame."; after Ctrl+Enter on the
      canvas exactly one action has `tabIndex` 0 and it has focus; arrows move between actions;
      the focus ring is tldraw's `--tl-color-focus`; the addon-a11y check passes.
      — `camera.stories.tsx`
- [x] **`EnterDownloads`** — with the frame selected and the canvas focused, Enter downloads a
      PNG; Ctrl+Enter doesn't. — `camera.stories.tsx`
- [x] **`CopyShortcut`** — with the frame selected and the canvas focused, a native `copy` event
      writes one `image/png` item to the clipboard (and not tldraw's shape copy).
      — `camera.stories.tsx`
- [x] **`FocusSurvivesKeyboardDownload`** — after Ctrl+Enter and Enter on "Download PNG", the
      download happens and the button still has focus; Enter on the canvas downloads and leaves
      focus on the canvas. Both hold with `<body>` focusable, where tldraw's `body.focus()`
      really takes focus. — `camera.stories.tsx`
- [ ] **`LocalisedAnnouncement`** — in French, selecting a frame announces "Crop frame", not
      `tool.crop-frame`. — `camera.stories.tsx`

### Lifecycle

- [x] **`ReadonlyHidesTool`** — in a read-only editor the tool button is absent, and an existing
      selected frame still exports. — `camera.stories.tsx`
- [x] **`CropFrameBoundsAreReactive`** — a `react()` over `getCropFrameBounds` sees a new frame,
      a move and a delete. — `camera.stories.tsx`
- [x] **`CropFrameBoundsIgnoreUnrelatedChanges`** — the same `react()` does not re-run when a
      rectangle moves, and does when the frame then moves. — `camera.stories.tsx`

### Pure helpers — `libs/web/features/camera/src/lib/utils.spec.ts`

- [x] `normaliseBox` (all four drag directions); `isBelowMinSize` (zoom-aware, 16 px).
- [x] `frameInsertIndex` — between the background and the lowest mark; on top with no marks;
      above existing frames.
- [ ] `exportShapeIds` — overlap within `EXPORT_EDGE_SLOP` kept, beyond it dropped, frames
      excluded, z-order preserved, empty result.
- [x] `exportPixelRatio` — 2 by default; clamped by the longest side; clamped by the area
      (4096² budget); `exportPixelSize` floors.
- [x] `buildExportFilename` — strips `.pdf`, folds accents, sanitises, caps at 100, `canvas`
      fallback, zero-padded local time.
- [ ] `isCropFrameShape` — true for `crop-frame`, false for other types.
- [x] `defaultFrameBox` — 300×200 screen px centred in the viewport (page units divide by zoom);
      each side capped at 80% of the viewport.
- [x] `cropToolbarAnchor` — the selection itself when there's room above; a zero-height box
      below the label when there isn't and there is room below; the selection when there's room
      on neither side, or when the selection's centre is off screen (so tldraw still hides it).

The two **Viewer:** criteria below live in `apps/web`, as route-level tests: the route is where
`createCameraExtension` and `retainPageBounds={getCropFrameBounds}` meet `PdfViewerScreen`
(ADR 0011 amendment), and camera never imports pdf-viewer. The camera side of both, the extension
and a reactive `getCropFrameBounds`, is done here; the route tests are still to write.

- [ ] **Viewer: includes the PDF page** — the route with a loaded document. A frame over the
      first page exports ids that include `shape:page-1`, and the name starts with the
      document's base name followed by `-crop-`. — `apps/web` route test
- [ ] **Viewer: retains pages under a frame** — a frame over page 1, then the camera panned until
      page 1 leaves the viewport: `shape:page-1` still exists, and an export includes it.
      — `apps/web` route test

## States

| State    | Handled | How                                                                              |
| -------- | ------- | -------------------------------------------------------------------------------- |
| Empty    | yes     | Frame over nothing: actions disabled, described by "Nothing inside"              |
| Loading  | yes     | Export in flight: clicked action busy (`aria-busy`), no second export per editor |
| Done     | yes     | Check mark on the action for 1.5 s, plus the success toast                       |
| Error    | yes     | Toast with the reason; clipboard failure offers download; the frame is kept      |
| Success  | yes     | Toast naming the file, or "Copied image"; the frame stays for re-export          |
| Disabled | yes     | Read-only editor: tool hidden; existing frames can still export                  |
| Overflow | yes     | Pixel ratio clamped by side and area, with an info toast giving the size         |

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
- **Copy on modifier-release** (the reference's ctrl-held drag). Ctrl/Cmd+C on the selected frame
  covers it without overloading the drag.
- **Toast styling and placement.** Owned by `@h2-fe/ui`'s toaster (see Decided behaviour).

## Open questions

- **Export during a page render.** Should export wait for retained pages that are still
  rasterising? That needs a viewer → camera readiness signal (for example
  `retainPageBounds` returning a promise). Deferred until a test shows the race in practice.
- **Re-created pages stack on top.** The viewer re-creates a page shape when it scrolls back
  into view, at the top of the page's z-order, above marks and frames. The stacking rule above
  only holds until then; the viewer should insert pages at the back.
