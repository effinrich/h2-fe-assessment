# Task 3 — pin tool

- Status: implemented in `@h2-fe/pin` (viewer wiring: see the ADR 0011 amendment below)
- Brief reference: README.pdf §3, task-3.mp4

## What the brief asks

> "**Task 3, we need a pin tool.** Real-life products often require deep integration with the
> Editor API from tldraw. We want to see how you can utilise not only the latest tools but also
> their latest functionalities. The tool should create a shape that:
>
> 1. Looks like a pin.
> 2. If the pin is on top of 2 overlapping shapes, the 2 shapes are 'attached'. That is, moving
>    one will move the other as well."

Two ambiguities are worth keeping. "2 overlapping shapes" does not say what happens with three, or
with one. "Attached" does not say whether the pin itself moves, or what detaches. The brief also
grades "the latest functionalities", so the APIs we use should be current tldraw 5.5 APIs, not
ones from older examples.

## What the demo does

Observed from the stills (`task-3.mp4`, frames f015–f078; see `docs/demos.md`). Anything marked
_inferred_ was not visible on screen.

- The toolbar's first tool is the pin, shown as tldraw's `?` fallback icon: no icon was supplied.
- Clicking places a fixed-size red pushpin. The pin tool stays active after placing (f022).
- A pin over two overlapping shapes attaches them. Dragging either one moves the other and the
  pin.
- A pin on a single shape follows that shape.
- Dragging the pin to empty canvas detaches it. The shapes then move independently (f045).
- Dragging a carried shape so the pin lands over another shape picks that shape up (f052–f060).
- Two shapes overlapping without a pin never attach (f068).
- No attach feedback: nothing highlights, and the pin looks the same free or holding.
- A selected pin shows only an opacity slider in the style panel (f030).

_Inferred:_ attachments are re-evaluated whenever a pin "comes to rest" (placement, pin drag end,
end of a drag that carried it). The behaviour matches tldraw's `pin-bindings` example, which
records changed shapes in `onAfterChangeToShape` and solves the connected network once in
`onOperationComplete`. The "Made with tldraw" badge and the missing icon both point to an
examples-app build rather than a product.

## What we do differently, and why

The attach rule is the reference's rule, generalised. "Better" is everything around it.

1. **All shapes under the pin attach, not just two.** The pin attaches every eligible shape under
   its point. Two is the brief's example, not a cap, and capping at two would raise a question
   the user can't answer ("which two?").
2. **The pin shows its state.** A free pin has an outlined head: its outline and needle are the
   theme's text colour at 70% opacity, which keeps at least 3:1 contrast against the canvas in
   both colour modes (the theme's grey is under 3:1 on the light canvas). A pin holding
   shapes is red with a filled head, plus a count badge when it holds two or more. On attach,
   the held shapes flash an outline and the pin pulses. Outside the flash, selecting or hovering
   the pin outlines what it holds. The reference has no feedback at all, so the user can't tell
   an attached group from shapes that merely overlap.
3. **A real icon and a shortcut.** A lucide `Pin` icon replaces the `?`. The shortcut is `P`,
   which tldraw doesn't use by default (verified below). Both appear in the toolbar tooltip and
   in the keyboard-shortcuts dialog.
4. **PDF pages and locked shapes never attach.** The PDF is the background. Pinning a mark to a
   page would make the mark immovable, because pages are locked. Worse, pages are virtualised:
   `syncVisiblePages` deletes off-screen page shapes and recreates them later, which would
   silently destroy the binding as soon as the user scrolled away.
5. **Undo is one step per user action.** Placing a pin (shape plus bindings) is one undo step.
   Dragging an attached group, including any re-attach when it lands, is one step. Dragging a
   pin off its shapes (detach) is one step.
6. **Tool lock is respected.** After placing a pin, the tool returns to select unless tldraw's
   tool lock (`instance.isToolLocked`) is on. That's how tldraw's own single-placement tools
   behave. The reference keeps the pin tool active, which makes the next click on a shape place
   a second pin instead of selecting the shape. The placed pin is selected (as tldraw's
   creation tools do), so its held outlines show once the attach flash ends and Delete removes
   it.
7. **Resizing and rotating don't drag the group.** Only pure translations propagate. Resizing a
   shape from its left edge changes its `x`, and a naive solver would read that as a move.

## Decided behaviour

- **Pin point.** The tip of the needle: the pin's page origin plus `PIN_TIP` (`consts.ts`). The
  pin has a fixed page size (`PIN_SIZE`), like the reference. It can't be resized or rotated: a
  selected pin shows no resize or rotate handles, rotating it alone (Shift+. / Shift+,) leaves
  it unchanged, and rotating it with other shapes carries its tip round with the selection while
  the pin stays upright. A multi-shape resize only translates it (`canResize` is false).
- **Outlines.** The attach flash and the held outline are each drawn as a 5px underlay in the
  canvas background colour, then a 2px accent in the theme red: solid for the flash, dashed
  (6/4) for held. Widths and dashes are screen pixels. The underlay keeps the accent legible
  over any fill or shape colour. All underlays are drawn before any accent, so outlines that
  cross don't cut through each other.
- **Minimum on-screen size.** Below 50% zoom the glyph stops shrinking: it is drawn at the size
  it has at 50%, scaled about its tip, so the tip still marks the pin point. Only the drawing
  scales; the hit geometry (head circle and needle) stays in page units, so hit-testing never
  depends on the camera.
- **Eligible shape.** A shape on the current page, under the pin point
  (`getShapesAtPoint(point, { hitInside: true })`), that is not a pin, frame or group, is not
  locked (`isShapeOrAncestorLocked`), and that tldraw allows to bind (`canBindShapes`). It must
  also pass `canAttach`, which can only narrow the built-in rules: the locked rule applies
  whatever `canAttach` says. The viewer route passes `!isPdfPageShape(shape)` (see
  Architecture); Task 4 excludes its crop frame the same way. `hitInside: true` is required:
  without it, unfilled geo shapes are hit only on their outline.
  _Implementation note:_ frames and groups are excluded because they move their children
  themselves. Pinning a frame and a shape inside it would make every drag of the child pull
  the frame along.
- **Locks.** A lock stops the user, not the pin. A held shape that becomes locked, directly or
  through a frame or group it sits in, is let go at once, in the same undo step as the lock
  (so one `undo()` unlocks it and re-attaches it). Unlocking it doesn't re-attach it; it
  attaches again the next time it or the pin settles. A locked pin still follows its held
  shapes, still settles (a shape dropped under its point attaches), and is still deleted with
  its last held shape: the pin logic writes with `ignoreShapeLock`.
- **Settle.** Settling recomputes a pin's attachments as exactly the eligible shapes under its
  point. It creates and deletes bindings to match, and re-baselines offsets. Settling runs:
  1. when a pin is placed (inside the placement transaction);
  2. when a translate, resize or rotate interaction ends (`select.translating`,
     `select.resizing` or `select.rotating` is exited), inside that interaction's undo step;
  3. after a keyboard nudge (arrow-key `key_up` in `select.idle`);
  4. when a held shape becomes locked (see **Locks**).

  After 2 and 3, only the pins the change can have affected settle: pins that moved, pins in
  the connected group of a shape that moved, and pins whose point lies inside a moved shape's
  page bounds from before or after the move. A shape "moved" if its position, parent, rotation
  or props changed since the last rest; the changes are collected as they happen. A shape
  drawn with a creation tool also ends in `select.resizing`, but drawing isn't a move: a new
  shape attaches once it is moved onto a pin, not when it is drawn.

- **Follow.** A pure translation of an attached shape moves every other member of its connected
  group rigidly. That includes shapes reached through other pins, so the groups are transitive.
  The pin itself moves with them.
- **Dragging the pin moves only the pin.** Its shapes stay where they are. When the drag ends,
  the pin settles: over empty canvas it detaches and becomes free; over other shapes it attaches
  to those instead. This is the reference's behaviour, and it is the only way to detach without
  deleting.
- **Deletion.** Deleting one held shape removes that binding only. Deleting a pin's last held
  shape also deletes the pin, in the same transaction, so a single undo restores both. Deleting
  a pin frees its shapes.
- **Duplicate and copy.** Duplicating a whole group (pin plus shapes) gives an independent
  attached group, provided tldraw duplicates bindings between duplicated shapes — a criterion
  below asserts it. Duplicating one held shape alone gives an unattached copy.
- **Style panel.** The pin has no styles of its own. Only tldraw's opacity row appears, as in the
  reference.

## Architecture

### Where the code lives

A new feature lib, generated rather than hand-made:

```
bunx nx g @nx/react:lib pin --directory=libs/web/features/pin --tags=scope:web,type:feature
```

Tags mirror `@h2-fe/pdf-viewer` (`scope:web`, `type:feature`; `npm:public` is inferred by Nx, not
declared). Layout as built, following the feature-based-architecture skill:

```
libs/web/features/pin/src/
  index.ts                     barrel: createPinExtension, PIN_TOOL_ID, types
  lib/
    consts.ts                  ids, PIN_KBD "p", PIN_SIZE, PIN_TIP, PIN_HEAD, PIN_EPSILON, ATTACH_FLASH_MS, overlay kinds
    types.ts                   PinShape, PinBinding (+ TLGlobalShapePropsMap / TLGlobalBindingPropsMap augmentation), PinExtension(Options), CanAttach
    utils.ts                   pure: isFar, pinOrigin, classifyChange, ancestorChange, connectedGroup, diffAttachments, solveGroup, pinColors, badgeLabel, glyphScale
    utils.spec.ts              Vitest for the above
    pin-queries.ts             editor reads: isPin, pinPointOf, pageOrigin, positionOf, neighbours, linksOf, eligibleAt
    pin-shape-util.tsx         ShapeUtil<PinShape>: geometry, free/holding state, badge, getIndicatorPath, toSvg
    pin-binding-util.ts        BindingUtil<PinBinding>: records drivers/reshapes/orphans, solves in onOperationComplete
    pin-follow.ts              follow, rebaselineBindings/rebaseline, deleteOrphans, and the frame/group (ancestor move) listener
    pin-settle.ts              settlePins(editor, pinIds, canAttach), the rest listener (interaction end, nudge) and the lock listener
    pin-tool.ts                StateNode: press places + settles + selects in one step; drag hands off to select.translating
    pin-feedback-overlay.ts    OverlayUtil: attach flash + held-shape outlines (tldraw 5 overlay API)
    pin-extension.ts           createPinExtension(options) → the extension object below
    partials/                  pin-view (canvas markup) composing attach-rings, head-ring, pin-badge; pin-glyph (SVG), pin-icon (lucide)
    pin-story-canvas.tsx       story-only <Tldraw> carrying the extension, with
    pin-story-toolbar.tsx        the toolbar and shortcuts-dialog slots the
    pin-story-shortcuts-dialog.tsx  viewer renders for extension tools
    story-helpers.ts           seeds, pointer helpers and assertions shared by the stories
    pin-*.stories.tsx          the acceptance stories by concern: tool, attach, follow, settle, delete (web Storybook stage)
```

### How it plugs into the existing editor

> **ADR 0011 amendment (2026-10-04).** Canvas extensions are feature libs without a screen,
> composed by the route. The viewer side of this section — the `extensions` prop, the merged
> toolbar and shortcuts dialog, `isPdfPageShape`, and the route wiring — is owned by
> `@h2-fe/pdf-viewer` and `apps/web`, not by this lib. The **Viewer integration** and
> **`isPdfPageShape`** criteria below moved with it to pdf-viewer's specs and stories (covered
> there with a stand-in extension). This lib's own stories mount a plain `<Tldraw>`.

`PdfViewerScreen` owns the `<Tldraw>` element (`pdf-viewer.tsx`), and the skill forbids sibling
feature imports. So `@h2-fe/pdf-viewer` never imports `@h2-fe/pin`. Instead:

- `PdfViewerScreen` gains `extensions?: CanvasExtension[]`, declared in pdf-viewer's `types.ts`
  using tldraw types only: `toolIds`, `shapeUtils`, `bindingUtils`, `tools`, `overlayUtils`,
  `overrides`, `InFrontOfTheCanvas`, `onMount`. It concatenates the arrays, passes `overrides`
  as an array (`TldrawUiProps.overrides` accepts `TLUiOverrides[]`), and composes the `onMount`
  handlers. It renders one toolbar (`DefaultToolbar` + a `ToolbarItem` per extension tool id +
  `DefaultToolbarContent`) and one shortcuts dialog. Both live in pdf-viewer `partials/`.
- `@h2-fe/pin` exports an object structurally matching `CanvasExtension`. The match is checked
  where the two meet: in `apps/web/src/app/routes/pdf-viewer-route/pdf-viewer-route.tsx`, which passes
  `extensions={[createPinExtension({ canAttach: (s) => !isPdfPageShape(s) }), cameraExtension]}`.
  The route already holds business wiring (ADR 0011). Extensions are created once, at module
  scope or in `useMemo`, because tldraw expects stable util arrays.
- `isPdfPageShape(shape)` is exported from `@h2-fe/pdf-viewer`'s `utils.ts`. It shares the
  existing `shape:page-N` pattern with `hasUserMarks`, so the two can't drift. Today a page is an
  `image` shape with id `shape:page-<n>`, `isLocked: true`, and asset `asset:page-<n>`, created
  with `history: "ignore"`. The predicate checks the id pattern and `type === "image"`. Locked
  state is covered independently by the default `canAttach`.
- Pins count as user marks in `hasUserMarks`, which is correct: they're user content.

### The follow solver, and why it can't loop

Data model: a `pin` binding runs `fromId` = pin to `toId` = held shape. Its props are
`{ offset: VecModel }`: the held shape's page origin minus the pin point, in page space, stored
at settle time.

1. `onAfterChangeToShape({ binding, shapeBefore, shapeAfter, reason })` classifies the change
   (`classifyChange`). A translation (`x`/`y`/`parentId` changed, nothing else that moves the
   origin) records the shape as a driver; so does `reason: "ancestry"`. A rotation or a props
   change (resize) records it as reshaped: its offset is re-baselined and it drives nothing.
2. The pin's own changes are ignored: dragging a pin moves only the pin.
3. `onOperationComplete` runs once per store operation. It snapshots and clears the recorded
   sets, re-baselines reshaped shapes, then for each connected group (a BFS over the pin
   bindings) takes the first recorded driver and computes the pin point as the driver's page
   origin minus its offset. Every other member (never a reshaped one) gets pin point plus its
   own offset, converted with `getPointInParentSpace`. Updates within 0.01 page units are
   skipped.
4. tldraw reports `ancestry` only when a shape is reparented, not when its frame or group
   moves. So the extension's `onMount` also registers a shape after-change handler that
   classifies every shape change with `ancestorChange`, which looks only at what moves the
   descendants: a changed `rotation` is a rotate; otherwise a changed `x`, `y` or `parentId` is a
   translate; `w`/`h` alone (a frame resized from its right or bottom edge) is nothing. At
   operation complete, a translated shape's held descendants (`visitDescendants`) drive their
   groups (`FollowsThroughFrame`, `FollowsThroughGroup`). A rotated shape's descendants turn
   with it, so every binding of its held descendants and of the pins inside it is
   re-baselined, and those shapes drive nothing (`RotateFrameThenDragDoesNotJump`).

_Deviation from the plan:_ there is no `solving` flag. tldraw delivers our own `updateShapes`
writes to the binding util in the next flush round, after `onOperationComplete` has returned,
so a flag cleared at the end of the solve wouldn't see them. Instead the solve is idempotent:
positions come from offsets, not per-change deltas, so the echo of a solve, a multi-select drag
(members already in place) and an undo/redo replay (already consistent) all solve to nothing
and write nothing (`NoUpdateLoop`, `MultiSelectDragNoDoubleMove`). Transitive groups and
multi-pin chains are just a larger BFS. Our improvements over tldraw's example are offset
solving (immune to double-apply), frame/group handling, the pure-translation guard, the
deletion cascade, and settle-on-rest.

**Deletion.** `onBeforeDeleteToShape` notes the pin. At operation complete, a noted pin left
with no bindings is deleted in the same step. Checking after the operation, not per binding,
means a pin whose shapes are all deleted at once doesn't survive as a free pin.

### Undo

- Placement runs `markHistoryStoppingPoint("creating:<id>")`, then
  `editor.run(() => { createShape; settle; select })`: one undo step. Dragging during the press
  hands the pin to `select.translating` with `isCreating` and that mark, so press-drag-release
  is still one step (`PressDragPlaces`).
- A drag: tldraw marks a stopping point when translating starts. The solver's updates happen
  inside the same operations, and the settle after the drag ends adds no mark, so undo reverts
  the drag, the followers and any re-attach together.
- Settle and solve never call `markHistoryStoppingPoint`.

## Verified tldraw 5.5.0 API

Checked against the installed type definitions. `E` is
`node_modules/@tldraw/editor/dist-cjs/index.d.ts`, `T` is `node_modules/tldraw/dist-cjs/index.d.ts`,
`S` is `node_modules/@tldraw/tlschema/dist-cjs/index.d.ts`.

| API                                                                                | Where              |
| ---------------------------------------------------------------------------------- | ------------------ |
| `ShapeUtil` (abstract)                                                             | E:6492             |
| `ShapeUtil.getIndicatorPath` (abstract, required)                                  | E:6598             |
| `ShapeUtil.canResize` / `hideResizeHandles` / `hideRotateHandle`                   | E:6656, 6753, 6759 |
| `ShapeUtil.canBind(opts)`                                                          | E:6644             |
| `ShapeUtil.onTranslateEnd(initial, current)`                                       | E:7065             |
| `BindingUtil` (abstract), `static type`, `getDefaultProps`                         | E:392, 402, 408    |
| `BindingUtil.onOperationComplete`                                                  | E:431              |
| `BindingUtil.onAfterChangeFromShape` / `onAfterChangeToShape`                      | E:489, 497         |
| `BindingUtil.onBeforeDeleteFromShape` / `onBeforeDeleteToShape`                    | E:505, 513         |
| `BindingOnShapeChangeOptions` (`binding`, `shapeBefore`, `shapeAfter`, `reason`)   | E:325              |
| `StateNode` (`static id`, `onPointerDown`, `onPointerUp`, `onKeyDown`)             | E:7344             |
| `TldrawEditorBaseProps.shapeUtils` / `bindingUtils` / `overlayUtils` / `tools`     | E:8024–8040        |
| `OverlayUtil` (`isActive`, `getOverlays`, `render`), `TLOverlay`                   | E:5867, 9210       |
| `editor.overlays.getCurrentOverlays()`                                             | E:1321, 5813       |
| `editor.getShapesAtPoint(point, { hitInside, margin })`                            | E:3166             |
| `editor.isShapeOrAncestorLocked(shape)`                                            | E:3101             |
| `editor.createBindings` / `createBinding`                                          | E:3465, 3470       |
| `editor.getBindingsFromShape` / `getBindingsToShape` / `getBindingsInvolvingShape` | E:3441, 3449, 3457 |
| `editor.updateBindings` / `deleteBindings`                                         | E:3476, 3486       |
| `editor.getShapePageTransform`                                                     | E:2981             |
| `editor.bringToFront`                                                              | E:3649             |
| `editor.markHistoryStoppingPoint` / `squashToMark` / `bailToMark`                  | E:1607, 1624, 1648 |
| `editor.run(fn, { history, ignoreShapeLock })`                                     | E:1676, 8555       |
| `editor.isIn(path)` / `getCurrentToolId()` / `setCurrentTool(id)`                  | E:1706, 1745, 1733 |
| `Editor extends EventEmitter<TLEventMap>`; events `before-event`, `event`          | E:1184, 8709–8710  |
| `instance.isToolLocked`                                                            | S:5468             |
| `editor.inputs.getCurrentPagePoint()`                                              | E:5237             |
| `TLGlobalShapePropsMap` / `TLGlobalBindingPropsMap` (custom record typing)         | S:5113, 5074       |
| `vecModelValidator`, `RecordProps`                                                 | S:7069, 2854       |
| `TLUiOverrides.tools` / `translations`                                             | T:5559             |
| `TLUiToolItem.icon: IconType \| TLUiIconJsx`, `kbd`                                | T:5763–5777        |
| `DefaultToolbar`, `DefaultToolbarContent`, `ToolbarItem`                           | T:1548, 1551, 5966 |
| `DefaultKeyboardShortcutsDialog(+Content)`, `TldrawUiMenuItem`                     | T:1423, 1426, 4551 |
| `TldrawUiProps.overrides: TLUiOverrides \| TLUiOverrides[]`                        | T:5010             |
| `tleditors.getMounted()` (story access to the editor)                              | E:8573, 8588       |

Added during implementation (`ST` is `@tldraw/store`, `SA` is `@tldraw/state`, same layout):

| API                                                                               | Where                      |
| --------------------------------------------------------------------------------- | -------------------------- |
| `Group2d`, `Circle2d`, `Rectangle2d` (pin geometry)                               | E:5032, 678, 6180          |
| `HTMLContainer`                                                                   | E:5176                     |
| `ShapeUtil.toSvg` / `hideSelectionBoundsBg` / `Fg` / `isAspectRatioLocked`        | E:6857, 6765, 6771, 6777   |
| `OverlayUtil` `options.zIndex`, `getOverlayUtilsInZOrder()`, `getOverlayUtil()`   | E:5883, 5796, 5788         |
| `strokeShapeIndicators(editor, ctx, ids)`                                         | E:7463                     |
| `editor.timers` / `editor.sideEffects`                                            | E:1276, 1327               |
| `sideEffects.registerAfterChangeHandler` / `registerOperationCompleteHandler`     | ST:2722, 2804              |
| `atom`                                                                            | SA:51                      |
| `editor.canBindShapes` / `getPointInParentSpace` / `visitDescendants`             | E:3494, 3236, 3397         |
| `editor.createShape` / `updateShapes` / `deleteShapes`                            | E:3817, 3930, 3945         |
| `editor.select` / `selectNone` / `getSelectedShapeIds` / `getHoveredShapeId`      | E:1886, 1949, 1843, 2102   |
| `editor.getCurrentTheme` / `getColorMode` / `getZoomLevel`                        | E:1378, 1359, 2231         |
| `editor.inputs.getOriginPagePoint` / `getIsDragging`                              | E:5201, 5339               |
| `editor.setCursor` / `updateInstanceState`                                        | E:1809, 1786               |
| `select.translating` info `onInteractionEnd`                                      | T:6383                     |
| `select.translating` info `isCreating` / `creatingMarkId` (runtime only, untyped) | `Translating.mjs:41`       |
| `ShapeUtil.onRotate(initial, current)`, `Vec.Rot` / `RotWith`                     | E:7125, 10223, 10224       |
| `editor.getSelectionPageBounds` / `inputs.getCtrlKey` (stories)                   | E:1983, 5309               |
| `sideEffects.registerBeforeChangeHandler` / `registerAfterCreateHandler`          | ST:2698, 2669              |
| `editor.getShapePageBounds`, `Box.containsPoint` / `clone`                        | E:2996, 624, 618           |
| `editor.groupShapes(ids, { groupId, select })` (stories)                          | E:3881                     |
| `overlays.getOverlayUtil(overlay)`, `OverlayUtil.getGeometry` (stories)           | E:5789, 5912               |
| `editor.toggleLock`; `toggle-lock` action (`shift+l`, own stopping point)         | E:3571, `actions.mjs:1349` |
| `editor.getEfficientZoomLevel` (cached while the camera moves)                    | E:2263                     |
| `user.getUserPreferences` / `updateUserPreferences({ colorScheme })` (stories)    | E:10012, 10011, 8072       |
| `editor.getCamera` / `setCamera` / `pageToScreen` / `getShapeGeometry` (stories)  | E:2222, 2326, 2552, 2923   |

**Corrections to earlier assumptions:**

- `ShapeUtil.indicator()` is **deprecated** (E:6610) and no longer rendered. Implement
  `getIndicatorPath()`. `BaseBoxShapeUtil` does not provide it (E:217–222).
- `getShapesAtPoint` does **not** filter locked shapes. Unless `hitInside` is passed it reports
  unfilled shapes only on their outline (`Editor.mjs:4447`). Both are handled by the eligibility
  rule above.
- tldraw ships **no** pin or sticker binding util. `pin-bindings` and `sticker-bindings` exist
  only in the examples app; none of their names appear in the installed types.
- `editor.inputs.currentPagePoint` is deprecated in favour of `getCurrentPagePoint()` (E:5239).
- Default single-key tool shortcuts in `useTools.mjs` and `actions.mjs`: `a b d e f g h k l n o q
r t v x z`. `P` is free.
- `lucide-react` was not installed when this spec was written; it has since been added at the
  root.
- `editor.overlays.getOverlayUtil(type)` throws for an unregistered type, so the shape util
  finds the feedback util with `getOverlayUtilsInZOrder()` and copes with its absence.
- tldraw's hover update is throttled (`updateHoveredShapeId`), so stories that assert on
  hover wait for it.

## Acceptance criteria

Test-first: each story is written and committed failing before its code exists. Stories live in
`libs/web/features/pin/src/lib/pin-<concern>.stories.tsx` (titles `Features/Pin/<Concern>`) and
run on the web Storybook stage. The harness mounts `<Tldraw>` with the pin extension and seeds, in page units:
**A** geo rectangle (0,0 200×120), **B** geo rectangle (150,60 160×120) overlapping A at
x 150–200 / y 60–120, and **C** geo rectangle (420,0 120×120), apart. A and B are unfilled, so
`hitInside` is exercised. Play functions get the editor via `tleditors.getMounted()[0]` and drive
real pointer events (`userEvent.pointer`) at `editor.pageToScreen(...)` coordinates.

- [x] **`ToolbarEntry`** — the toolbar has a button named "Pin" containing an `svg` (not the `?`
      fallback). Pressing `p` makes `getCurrentToolId()` `"pin"`. The shortcuts dialog lists
      "Pin" with `P`. — `pin-tool.stories.tsx`
- [x] **`PlaceOnOverlapAttachesBoth`** — with the pin tool, click at (175,90). Exactly one `pin`
      shape exists, and its `getBindingsFromShape(pin, "pin")` `toId`s equal {A, B}. The pin is
      the selection. With tool lock off, the current tool is `"select"`. — `pin-attach.stories.tsx`
- [x] **`ToolLockKeepsPinTool`** _(added)_ — with tool lock on, the pin tool stays active after
      placing, and the next click places a second pin. — `pin-tool.stories.tsx`
- [x] **`PlaceAttachesAllUnderPoint`** — add D overlapping the A∩B point. One click attaches
      {A, B, D}, and the pin badge reads "3". — `pin-attach.stories.tsx`
- [x] **`DragOneMovesAll`** — after `PlaceOnOverlapAttachesBoth`, drag A by (+100,+50). B and the
      pin each moved by (+100,+50) ±0.5; C is unchanged. — `pin-follow.stories.tsx`
- [x] **`DragEitherMember`** — dragging B instead moves A and the pin by the same delta.
      — `pin-follow.stories.tsx`
- [x] **`SingleShapeFollow`** — pin C alone (1 binding). Dragging C moves the pin by the same
      delta. — `pin-follow.stories.tsx`
- [x] **`FreePinOnEmptyCanvas`** — clicking empty canvas creates a pin with 0 bindings, whose
      element has `data-state="free"`. A holding pin has `data-state="holding"`.
      — `pin-attach.stories.tsx`
- [x] **`FreePinContrast`** _(added)_ — a free pin's rendered head outline, blended at its
      rendered opacity over the theme background, has a contrast ratio of at least 3:1 against
      that background, in light mode and in dark mode. — `pin-attach.stories.tsx`
- [x] **`PinKeepsMinimumSize`** _(added)_ — at 100% zoom the pin's glyph is 36px tall on
      screen. At 25% it is 18px tall (its size at 50%), its bottom still at the tip's screen
      point, and its geometry bounds are those it had at 100%. — `pin-attach.stories.tsx`
- [x] **`AttachFeedback`** — right after attaching A and B, `editor.overlays.getCurrentOverlays()`
      contains `pin-attach:<A>` and `pin-attach:<B>`. After `ATTACH_FLASH_MS` they are gone.
      With nothing selected, hovering the pin brings the held outlines back and hovering away
      clears them; selecting the pin brings them back. — `pin-attach.stories.tsx`
- [x] **`OutlinesHaveUnderlay`** _(added)_ — render the feedback overlay into a recording
      context. Right after attaching A and B, the strokes are a 5px background-coloured
      underlay with no dash, then a 2px solid red accent. Once the flash ends (pin selected),
      they are the underlay, then a 2px red accent dashed 6/4. Widths and dashes are divided
      by the zoom. — `pin-attach.stories.tsx`
- [x] **`ReducedMotionHalo`** _(added)_ — right after attaching, the pin has a halo element
      whose computed size is the head's diameter + 6px (not the head's size), centred on the
      head, at opacity 0.5. Exactly one of halo and ping is displayed: the halo when
      `(prefers-reduced-motion: reduce)` matches, the ping otherwise. — `pin-attach.stories.tsx`
- [x] **`DragPinToEmptyDetaches`** — drag the pin from A∩B to empty canvas. The pin has 0
      bindings, and dragging A moves A but no longer moves B. — `pin-settle.stories.tsx`
- [x] **`DragPinOntoOverlapAttaches`** — dragging a free pin onto A∩B ends with bindings {A, B}.
      — `pin-settle.stories.tsx`
- [x] **`CarryOntoShapePicksUp`** — pin C alone, then drag C until the pin point lies over A. On
      release, the bindings are {C, A}. — `pin-settle.stories.tsx`
- [x] **`OverlapWithoutPinDoesNotAttach`** — drag C to overlap A with no pin (asserted: their
      page bounds collide). No `pin` bindings exist, and dragging A moves A and leaves C
      unchanged. — `pin-settle.stories.tsx`
- [x] **`NeverAttachesToPdfPage`** — seed a locked `image` shape `shape:page-1` under A, and
      mount with a `canAttach` that mirrors `isPdfPageShape` (this lib may not import
      pdf-viewer). A pin on A over the page binds {A} only. A pin on the page alone is free,
      and stays free once the page is unlocked, so `canAttach` works on its own and not only
      through the locked rule. Deleting `shape:page-1` (as virtualisation does) leaves the pin
      and its binding to A intact. — `pin-attach.stories.tsx`
- [x] **`PlainExtensionAttachesUnlockedPage`** _(added, control)_ — under plain
      `createPinExtension()`, a pin on an unlocked `shape:page-1` holds it, so the exclusion
      above comes from `canAttach`. — `pin-attach.stories.tsx`
- [x] **`NeverAttachesToLockedShapes`** — lock B. A pin at A∩B binds {A} only. — `pin-attach.stories.tsx`
- [x] **`LockingHeldShapeDetaches`** _(added)_ — pin at A∩B; select B and lock it (Shift+L).
      The pin holds {A}. One `undo()` unlocks B and the pin holds {A, B} again; `redo()` locks
      and detaches it again. Dragging A then leaves B. — `pin-settle.stories.tsx`
- [x] **`LockingFrameDetachesHeldChild`** _(added)_ — A inside a frame, pinned with B; locking
      the frame lets A go: the pin holds {B}. — `pin-settle.stories.tsx`
- [x] **`LockedPinStillFollows`** _(added)_ — pin at A∩B, then lock the pin. Dragging A moves B
      and the pin by the same delta; the pin stays locked and holds {A, B}.
      — `pin-follow.stories.tsx`
- [x] **`LockedOrphanPinIsDeleted`** _(added)_ — lock the pin, then delete A and B. The pin is
      gone; one `undo()` restores all three, the pin still locked, with bindings {A, B}.
      — `pin-delete.stories.tsx`
- [x] **`ReadonlyHidesTool`** _(added)_ — switching the editor to read-only removes the Pin
      toolbar button. — `pin-tool.stories.tsx`
- [x] **`TransitiveGroup`** — pin P1 at A∩B; move C to overlap B and pin P2 at B∩C. Dragging A
      moves B, C, P1 and P2 by the same delta. — `pin-follow.stories.tsx`
- [x] **`NoUpdateLoop`** — in the transitive group, count store changes per shape during a single
      `editor.updateShape({ id: A, x: A.x + 10 })`. B, C, P1 and P2 are each updated exactly once,
      and the call returns. — `pin-follow.stories.tsx`
- [x] **`MultiSelectDragNoDoubleMove`** — select A and B together and drag by (+40,0). Each moves
      +40, not +80. — `pin-follow.stories.tsx`
- [x] **`ResizeDoesNotDragGroup`** — resize A from its left handle, so its `x` changes. B and the
      pin don't move, and A stays attached. — `pin-follow.stories.tsx`
- [x] **`FollowsThroughFrame`** — put A inside a tldraw frame, pinned to B outside it. Dragging
      the frame moves B by the frame's delta. — `pin-follow.stories.tsx`
- [x] **`FollowsThroughGroup`** _(added)_ — group A with C; a pin at A∩B holds {A, B}. Dragging
      the group (by C) moves A, B, C and the pin by the same delta. — `pin-follow.stories.tsx`
- [x] **`RotateFrameThenDragDoesNotJump`** _(added)_ — A inside a frame, pinned with B. Rotate
      the frame (Shift+.), then drag A: A, B and the pin all move by the drag's delta, and
      nothing jumps. — `pin-follow.stories.tsx`
- [x] **`UndoPlacementIsOneStep`** — after placing at A∩B, one `undo()` leaves no pin and no
      `pin` bindings, and one `redo()` restores the pin and both bindings. — `pin-tool.stories.tsx`
- [x] **`UndoDragIsOneStep`** — after `DragOneMovesAll`, one `undo()` returns A, B and the pin to
      their pre-drag positions. — `pin-follow.stories.tsx`
- [x] **`UndoDetachIsOneStep`** — after `DragPinToEmptyDetaches`, one `undo()` returns the pin to
      A∩B with bindings {A, B}. — `pin-settle.stories.tsx`
- [x] **`RotateOffPinDetaches`** _(added)_ — a pin at (10,10) holds {A}. Select A and drag its
      top-right rotate handle 30° anticlockwise about A's centre: on release the pin holds
      nothing. One `undo()` restores A's rotation and the binding. — `pin-settle.stories.tsx`
- [x] **`ResizeOffPinDetaches`** _(added)_ — a pin at (10,10) holds {A}. Resizing A from its
      left handle by +40 leaves the pin holding nothing; one `undo()` restores both.
      — `pin-settle.stories.tsx`
- [x] **`UnrelatedDragLeavesDistantPin`** _(added)_ — pin at A∩B; lock then unlock B, so the
      pin holds {A} with B under its point. Dragging C (far away) leaves the pin holding {A}.
      Dragging B by 5 units then settles it: it holds {A, B}. — `pin-settle.stories.tsx`
- [x] **`DrawingAShapeDoesNotAttach`** _(added, guard)_ — a free pin at empty canvas; drawing a
      rectangle across its point with the geo tool leaves it free. Dragging the new rectangle
      by 10 units attaches it. — `pin-settle.stories.tsx`
- [x] **`NudgeResettles`** _(added)_ — a pin just inside A's edge holds {A, B}; a Shift+→
      nudge moves it 10 units past the edge, and on key release it holds {B}.
      — `pin-settle.stories.tsx`
- [x] **`PressDragPlaces`** _(added)_ — pressing with the pin tool and dragging before release
      drops the pin where the drag ends, attached there, in one undo step. — `pin-tool.stories.tsx`
- [x] **`EscapeDuringPressDragRemovesPin`** _(added)_ — press with the pin tool, drag, press
      Escape before releasing: no pin and no bindings remain, and `undo()` brings none back.
      — `pin-tool.stories.tsx`
- [x] **`PinCannotResizeOrRotate`** _(added)_ — a selected pin has no `selection_fg:*`
      handles; Shift+. leaves its rotation 0 and its tip in place; Shift+. with C also selected
      rotates C, carries the pin's tip round the selection centre by the same angle, and leaves
      the pin's rotation 0. — `pin-tool.stories.tsx`
- [x] **`DeleteCascade`** — delete A from pin(A,B): the pin remains, with bindings {B}. Delete B:
      the pin is gone. One `undo()` restores B and the pin with its binding. — `pin-delete.stories.tsx`
- [x] **`DeleteAllHeldAtOnce`** _(added)_ — deleting A and B together deletes the pin; one
      `undo()` restores all three with bindings {A, B}. — `pin-delete.stories.tsx`
- [x] **`DeletePinFreesShapes`** _(added)_ — deleting the pin leaves A and B with no `pin`
      bindings; dragging A then leaves B unchanged. — `pin-delete.stories.tsx`
- [x] **`DuplicateGroup`** — select the pin, A and B, then duplicate. The copies form an
      independent attached group: dragging copy-A moves copy-B and not the originals.
      — `pin-follow.stories.tsx`
- [x] **`DuplicateOneHeldShape`** _(added)_ — duplicating A alone gives a copy with no `pin`
      bindings; the pin still holds {A, B}, and dragging the copy moves nothing else.
      — `pin-follow.stories.tsx`
- [x] **Pure helpers** — `pinOrigin`, `isFar` (per-axis epsilon), `classifyChange` (a
      translation is `x`/`y`/parent alone; resize and rotation are reshapes; props compared by
      value), `ancestorChange` (rotation is a rotate, with or without a move; x/y/parent a
      translate whatever the props do; size alone nothing), `connectedGroup` (cycles, chains,
      isolated nodes), `diffAttachments`
      (create/remove), `solveGroup` (offsets → targets, epsilon skip, first path wins),
      `badgeLabel` (none below 2, caps at "9+"), `glyphScale` (1 at 50% zoom and above,
      0.5 / zoom below). — `libs/web/features/pin/src/lib/utils.spec.ts`

Moved out of this lib by the ADR 0011 amendment (owned by pdf-viewer, tracked there):

- **Viewer integration** — `PdfViewerScreen` with `extensions` renders the extension's toolbar
  item. Covered with a stand-in extension. — `libs/web/features/pdf-viewer/src/lib/pdf-viewer.stories.tsx`
- **`isPdfPageShape`** — true for `image` shapes with id `shape:page-<n>`; false for other ids
  and types. — `libs/web/features/pdf-viewer/src/lib/utils.spec.ts`

## States

| State    | Handled | How                                                                              |
| -------- | ------- | -------------------------------------------------------------------------------- |
| Empty    | yes     | Pin on empty canvas: free pin, outlined head at ≥3:1 contrast, 0 bindings        |
| Loading  | n/a     | Placement is synchronous                                                         |
| Error    | yes     | Ineligible targets (pages, locked) are skipped silently; the pin is still placed |
| Success  | yes     | Holding appearance, count badge, attach flash and outlines                       |
| Disabled | yes     | Read-only editor: the tool item is hidden (no `readonlyOk`)                      |
| Overflow | yes     | Many shapes under one point attach; badge caps at "9+"                           |

Reduced motion: under `prefers-reduced-motion`, the ping is replaced by a static halo for the
same duration: a ring 6px wider than the head (3px clear of it all round) at 50% opacity, so it
reads as a separate mark rather than a thicker head outline. The ping and the halo are separate
elements, each hidden under the other preference (Chakra `_motionReduce` / `_motionSafe`). The
shape outlines don't animate either way.

## Out of scope

- **Zoom-independent pin size.** The pin has a fixed page size, like the reference. Counter-
  scaling with zoom would make its hit geometry depend on camera state. Below 50% zoom only
  the drawing keeps a minimum size (see **Minimum on-screen size**).
- **Propagating rotation or resize.** Only translation is rigid. A rotated or resized member
  keeps its attachment with a re-baselined offset.
- **Solving align/distribute deterministically.** When several members move by different
  deltas in one operation, the first recorded driver wins.
- **Pin colours or labels.** One pin style. The style panel stays opacity-only.
- **Persistence across reload.** As with everything else, nothing persists beyond tldraw's local
  store (ADR 0009).

## Open questions

- ~~**ADR 0011 says features are routes.**~~ Resolved by the ADR 0011 amendment (2026-10-04):
  canvas extensions are feature libs without a screen, composed by the route.
- **Identify pages by `meta` instead of the id pattern.** Setting `meta: { pdfPage: n }` on page
  shapes in `syncVisiblePages` would be sturdier. That's a pdf-viewer change, so it's deferred
  and recorded here.
- ~~**Driving pointer events in play tests.**~~ Resolved: real `userEvent.pointer` drags work
  in the browser runner; no `editor.dispatch` fallback was needed.
- ~~**The lucide icon type.**~~ Resolved: `TLUiIconJsx` (T:5359) is cloned with `className`,
  `style` and `aria-label`. `PinIcon` accepts those and lands them on the lucide svg through
  `Box asChild` (18px, `strokeWidth` 1.5, matching tldraw's icons). In the toolbar the label is
  empty, so the svg is decorative and the button carries the name.

## Known limitations

- Keyboard and menu transforms (rotate with Shift+. / Shift+,, flip, align, distribute, stack)
  aren't interactions and don't settle: a shape they carry off a pin's point stays held until
  its next settle.
- Unlocking a shape a lock detached doesn't re-attach it; it waits for its next settle.
- A pin placed inside a frame becomes the frame's child (tldraw parents new shapes to the
  frame under them), so it tilts when the frame is rotated. Its own rotation stays 0, and its
  bindings are re-baselined.
- The SVG export (`toSvg`) draws the pin but not the count badge.
- Moving a pin programmatically (not by a drag or nudge) keeps its stale offsets until the
  next settle.
- Follow through frames and groups, and settle-on-rest, rely on the host calling the
  extension's `onMount`.
