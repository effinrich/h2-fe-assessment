# Task 3 — pin tool

- Status: draft
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
2. **The pin shows its state.** A free pin is muted grey with an outlined head. A pin holding
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
   a second pin instead of selecting the shape.
7. **Resizing and rotating don't drag the group.** Only pure translations propagate. Resizing a
   shape from its left edge changes its `x`, and a naive solver would read that as a move.

## Decided behaviour

- **Pin point.** The tip of the needle: the pin's page origin plus `PIN_TIP` (`consts.ts`). The
  pin has a fixed page size (`PIN_SIZE`), like the reference. It can't be resized or rotated.
- **Eligible shape.** A shape on the current page, under the pin point
  (`getShapesAtPoint(point, { hitInside: true })`), that is not a pin and not a crop frame
  (Task 4). It must also pass `canAttach`, which by default rejects anything for which
  `isShapeOrAncestorLocked` is true. The viewer adds `!isPdfPageShape(shape)` (see
  Architecture). `hitInside: true` is required: without it, unfilled geo shapes are hit only on
  their outline.
- **Settle.** Settling recomputes a pin's attachments as exactly the eligible shapes under its
  point. It creates and deletes bindings to match, and re-baselines offsets. Settling runs:
  1. when a pin is placed (inside the placement transaction);
  2. when a translate interaction ends (`select.translating` is exited), for every pin on the
     page — pins are few, and a settle that changes nothing writes nothing;
  3. after a keyboard nudge (arrow-key `key_up` in `select.idle`).
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
declared). Planned layout, following the feature-based-architecture skill:

```
libs/web/features/pin/src/
  index.ts                     barrel: pinExtension, createPinExtension, PIN_TOOL_ID
  lib/
    consts.ts                  PIN_TOOL_ID "pin", PIN_BINDING "pin", PIN_KBD "p", PIN_SIZE, PIN_TIP, ATTACH_FLASH_MS
    types.ts                   PinShape, PinBinding (+ TLGlobalShapePropsMap / TLGlobalBindingPropsMap augmentation), PinExtensionOptions
    utils.ts                   pure: pinPoint, isPureTranslation, connectedGroup, diffAttachments, solveGroup
    utils.spec.ts              Vitest for the above
    pin-shape-util.tsx         ShapeUtil<PinShape>: SVG pushpin, free/holding state, count badge, getIndicatorPath
    pin-binding-util.ts        BindingUtil<PinBinding>: follow solver, deletion cascade
    pin-tool.ts                StateNode: click places + settles in one transaction
    pin-settle.ts              settle(editor, pinIds) and the translate-end / nudge listener
    pin-feedback-overlay.ts    OverlayUtil: attach flash + held-shape outlines (tldraw 5 overlay API)
    pin-extension.ts           createPinExtension(options) → the extension object below
    pin.stories.tsx            the acceptance stories (web Storybook stage)
```

### How it plugs into the existing editor

`PdfViewerScreen` owns the `<Tldraw>` element (`pdf-viewer.tsx`), and the skill forbids sibling
feature imports. So `@h2-fe/pdf-viewer` never imports `@h2-fe/pin`. Instead:

- `PdfViewerScreen` gains `extensions?: CanvasExtension[]`, declared in pdf-viewer's `types.ts`
  using tldraw types only: `toolIds`, `shapeUtils`, `bindingUtils`, `tools`, `overlayUtils`,
  `overrides`, `InFrontOfTheCanvas`, `onMount`. It concatenates the arrays, passes `overrides`
  as an array (`TldrawUiProps.overrides` accepts `TLUiOverrides[]`), and composes the `onMount`
  handlers. It renders one toolbar (`DefaultToolbar` + a `ToolbarItem` per extension tool id +
  `DefaultToolbarContent`) and one shortcuts dialog. Both live in pdf-viewer `partials/`.
- `@h2-fe/pin` exports an object structurally matching `CanvasExtension`. The match is checked
  where the two meet: in `apps/web/src/app/routes/pdf-viewer-route.tsx`, which passes
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

1. `onAfterChangeToShape({ binding, shapeBefore, shapeAfter, reason })` records the changed
   shape in `pending`, unless `solving` is set. A `reason: "self"` change that is not a pure
   translation (rotation or size props changed) is recorded as a re-baseline, not as a driver.
   `reason: "ancestry"` (the parent frame or group moved) counts as a translation.
2. `onAfterChangeFromShape` (the pin moved) is never a driver: dragging a pin moves only the pin.
3. `onOperationComplete` runs once per store operation. If `pending` is empty, it returns.
   Otherwise it sets `solving`, then for each connected group (a BFS over
   `getBindingsInvolvingShape(id, "pin")`) it takes the first recorded driver and computes the
   new pin point as the driver's page origin minus its offset. Every other member gets pin
   point plus its own offset, converted into its parent's space. Updates within 0.01 page units
   are skipped. Re-baselines rewrite their offset with `updateBindings`. Then it clears
   `solving` and `pending`.

Our own `updateShapes` calls inside the solve fire step 1 again, and the `solving` guard drops
them. Because positions are solved from offsets rather than per-change deltas, a member that
moved by the same delta as the driver (multi-select drag) gets a no-op update instead of a
double move. Transitive groups and multi-pin chains are just a larger BFS. Our improvements over
tldraw's example are offset solving (immune to double-apply), ancestry handling, the
pure-translation guard, the deletion cascade, and settle-on-rest.

### Undo

- Placement runs `markHistoryStoppingPoint("pin")`, then
  `editor.run(() => { createShape; settle })`: one undo step.
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
- `lucide-react` is **not installed**. It needs a root `bun add lucide-react` (not run here).

## Acceptance criteria

Test-first: each story is written and committed failing before its code exists. Stories live in
`libs/web/features/pin/src/lib/pin.stories.tsx` (title `Features/Pin`) and run on the web
Storybook stage. The harness mounts `<Tldraw>` with the pin extension and seeds, in page units:
**A** geo rectangle (0,0 200×120), **B** geo rectangle (150,60 160×120) overlapping A at
x 150–200 / y 60–120, and **C** geo rectangle (420,0 120×120), apart. A and B are unfilled, so
`hitInside` is exercised. Play functions get the editor via `tleditors.getMounted()[0]` and drive
real pointer events (`userEvent.pointer`) at `editor.pageToScreen(...)` coordinates.

- [ ] **`ToolbarEntry`** — the toolbar has a button named "Pin" containing an `svg` (not the `?`
      fallback). Pressing `p` makes `getCurrentToolId()` `"pin"`. The shortcuts dialog lists
      "Pin" with `P`. — `pin.stories.tsx`
- [ ] **`PlaceOnOverlapAttachesBoth`** — with the pin tool, click at (175,90). Exactly one `pin`
      shape exists, and its `getBindingsFromShape(pin, "pin")` `toId`s equal {A, B}. With tool
      lock off, the current tool is `"select"`. — `pin.stories.tsx`
- [ ] **`PlaceAttachesAllUnderPoint`** — add D overlapping the A∩B point. One click attaches
      {A, B, D}, and the pin badge reads "3". — `pin.stories.tsx`
- [ ] **`DragOneMovesAll`** — after `PlaceOnOverlapAttachesBoth`, drag A by (+100,+50). B and the
      pin each moved by (+100,+50) ±0.5; C is unchanged. — `pin.stories.tsx`
- [ ] **`DragEitherMember`** — dragging B instead moves A and the pin by the same delta.
      — `pin.stories.tsx`
- [ ] **`SingleShapeFollow`** — pin C alone (1 binding). Dragging C moves the pin by the same
      delta. — `pin.stories.tsx`
- [ ] **`FreePinOnEmptyCanvas`** — clicking empty canvas creates a pin with 0 bindings, whose
      element has `data-state="free"`. A holding pin has `data-state="holding"`.
      — `pin.stories.tsx`
- [ ] **`AttachFeedback`** — right after attaching A and B, `editor.overlays.getCurrentOverlays()`
      contains `pin-attach:<A>` and `pin-attach:<B>`. After `ATTACH_FLASH_MS` they are gone.
      Selecting the pin brings the held outlines back. — `pin.stories.tsx`
- [ ] **`DragPinToEmptyDetaches`** — drag the pin from A∩B to empty canvas. The pin has 0
      bindings, and dragging A no longer moves B. — `pin.stories.tsx`
- [ ] **`DragPinOntoOverlapAttaches`** — dragging a free pin onto A∩B ends with bindings {A, B}.
      — `pin.stories.tsx`
- [ ] **`CarryOntoShapePicksUp`** — pin C alone, then drag C until the pin point lies over A. On
      release, the bindings are {C, A}. — `pin.stories.tsx`
- [ ] **`OverlapWithoutPinDoesNotAttach`** — drag C to overlap A with no pin. No `pin` bindings
      exist, and dragging A leaves C unchanged. — `pin.stories.tsx`
- [ ] **`NeverAttachesToPdfPage`** — seed a locked `image` shape `shape:page-1` under A, and
      mount with `canAttach: (s) => !isPdfPageShape(s)`. A pin on A over the page binds {A} only.
      A pin on the page alone is free. Deleting `shape:page-1` (as virtualisation does) leaves
      the pin and its binding to A intact. — `pin.stories.tsx`
- [ ] **`NeverAttachesToLockedShapes`** — lock B. A pin at A∩B binds {A} only. — `pin.stories.tsx`
- [ ] **`TransitiveGroup`** — pin P1 at A∩B; move C to overlap B and pin P2 at B∩C. Dragging A
      moves B, C, P1 and P2 by the same delta. — `pin.stories.tsx`
- [ ] **`NoUpdateLoop`** — in the transitive group, count store changes per shape during a single
      `editor.updateShape({ id: A, x: A.x + 10 })`. B, C, P1 and P2 are each updated exactly once,
      and the call returns. — `pin.stories.tsx`
- [ ] **`MultiSelectDragNoDoubleMove`** — select A and B together and drag by (+40,0). Each moves
      +40, not +80. — `pin.stories.tsx`
- [ ] **`ResizeDoesNotDragGroup`** — resize A from its left handle, so its `x` changes. B and the
      pin don't move, and A stays attached. — `pin.stories.tsx`
- [ ] **`FollowsThroughFrame`** — put A inside a tldraw frame, pinned to B outside it. Dragging
      the frame moves B by the frame's delta. — `pin.stories.tsx`
- [ ] **`UndoPlacementIsOneStep`** — after placing at A∩B, one `undo()` leaves no pin and no
      `pin` bindings, and one `redo()` restores the pin and both bindings. — `pin.stories.tsx`
- [ ] **`UndoDragIsOneStep`** — after `DragOneMovesAll`, one `undo()` returns A, B and the pin to
      their pre-drag positions. — `pin.stories.tsx`
- [ ] **`UndoDetachIsOneStep`** — after `DragPinToEmptyDetaches`, one `undo()` returns the pin to
      A∩B with bindings {A, B}. — `pin.stories.tsx`
- [ ] **`DeleteCascade`** — delete A from pin(A,B): the pin remains, with bindings {B}. Delete B:
      the pin is gone. One `undo()` restores B and the pin with its binding. — `pin.stories.tsx`
- [ ] **`DuplicateGroup`** — select the pin, A and B, then duplicate. The copies form an
      independent attached group: dragging copy-A moves copy-B and not the originals.
      — `pin.stories.tsx`
- [ ] **Pure helpers** — `pinPoint`, `isPureTranslation` (true only when `x`/`y` alone
      changed), `connectedGroup` (cycles, chains, isolated nodes), `diffAttachments`
      (create/delete/keep), `solveGroup` (offsets → targets, epsilon skip).
      — `libs/web/features/pin/src/lib/utils.spec.ts`
- [ ] **Viewer integration** — `PdfViewerScreen` with `extensions` renders the Pin toolbar item.
      A pin placed over the example page attaches to no page shape.
      — `libs/web/features/pdf-viewer/src/lib/pdf-viewer.stories.tsx`
- [ ] **`isPdfPageShape`** — true for `image` shapes with id `shape:page-<n>`; false for other
      ids and types. — `libs/web/features/pdf-viewer/src/lib/pdf-viewer.spec.tsx`

## States

| State    | Handled | How                                                                              |
| -------- | ------- | -------------------------------------------------------------------------------- |
| Empty    | yes     | Pin on empty canvas: free pin, muted appearance, 0 bindings                      |
| Loading  | n/a     | Placement is synchronous                                                         |
| Error    | yes     | Ineligible targets (pages, locked) are skipped silently; the pin is still placed |
| Success  | yes     | Holding appearance, count badge, attach flash and outlines                       |
| Disabled | yes     | Read-only editor: the tool item is hidden (no `readonlyOk`)                      |
| Overflow | yes     | Many shapes under one point attach; badge caps at "9+"                           |

Reduced motion: under `prefers-reduced-motion`, the pulse is replaced by a static outline of the
same duration.

## Out of scope

- **Zoom-independent pin size.** The pin has a fixed page size, like the reference. Counter-
  scaling with zoom would make its hit geometry depend on camera state.
- **Propagating rotation or resize.** Only translation is rigid. A rotated or resized member
  keeps its attachment with a re-baselined offset.
- **Solving align/distribute deterministically.** When several members move by different
  deltas in one operation, the first recorded driver wins.
- **Pin colours or labels.** One pin style. The style panel stays opacity-only.
- **Persistence across reload.** As with everything else, nothing persists beyond tldraw's local
  store (ADR 0009).

## Open questions

- **ADR 0011 says features are routes.** Pin (and camera) are feature libs with no screen. This
  needs an ADR 0011 amendment ("canvas extensions are feature libs without a screen, composed
  by the route"), or an explicit decision to use another tag.
- **Identify pages by `meta` instead of the id pattern.** Setting `meta: { pdfPage: n }` on page
  shapes in `syncVisiblePages` would be sturdier. That's a pdf-viewer change, so it's deferred
  and recorded here.
- **Driving pointer events in play tests.** `userEvent.pointer` against the tldraw canvas needs
  pointer capture to behave in the browser runner. If it proves flaky, fall back to
  `editor.dispatch(info)` (E:4537) for the drag criteria and say so in the test.
- **The lucide icon type.** `TLUiIconJsx` is typed as `ReactElement<HTMLAttributes<HTMLDivElement>>`
  (T:5359). Wrap the lucide `<Pin>` in a `div` so tldraw's cloned props land on a div. Match
  tldraw's icon weight (`strokeWidth` 1.5, size 18) so the toolbar stays visually consistent.
