# 0016 — The pin is a shape, and the attachment is a constraint

- Status: accepted
- Date: 2026-10-26

## Context

Task 3 of the brief asks for a pin tool that needs "deep integration with the
Editor API from tldraw", and that creates a shape which looks like a pin. If
the pin is on top of two overlapping shapes, the two are attached: moving one
moves the other.

tldraw ships a
[pin-bindings example](https://tldraw.dev/examples/pin-bindings), and the brief
is explicit that the demos it comes with are "competitors' references, not our
own design" — the submission is meant to be better than the reference rather
than a copy of it. The example is also written for a bare canvas. This app is
a PDF: the pages are locked image shapes, and a pin that dragged a document
page across the canvas would be a bug rather than a feature.

Two things had to be decided. What the pin attaches to, and what "attached"
means once it has something to hold.

## Decision

**A custom shape, a custom binding, and a constraint solver.**

- `PinShapeUtil` (`pin-shape-util.tsx`) is a custom shape. The glyph is the
  📍 emoji in an `HTMLContainer`, with a `toSvg` override so the pin survives
  an export. The geometry is offset so the shape's origin is the pin's _tip_
  — the point that binds — and it is sized for PDF pages, which are
  rasterised at 2x. It cannot be edited, resized or rotated, and it cannot
  pin another pin, though an arrow can still bind to it.
- `PinBindingUtil` (`pin-binding-util.ts`) is a custom binding with one prop:
  `anchor`, the point on the target shape that the pin holds, normalised
  within that shape's bounds. Normalised rather than absolute, so the pin
  keeps its spot on the target when the target is resized.
- The attachment is solved rather than scripted. When a shape that holds a
  pin moves, the pin and every shape it holds are collected into a network,
  and a small relaxation solver finds the positions that satisfy the anchors
  while the shapes the user is actually dragging stay put. This is why the
  behaviour generalises: two overlapping shapes are the brief's case, but a
  chain of five shapes through two pins resolves the same way.
- `PinTool` (`pin-tool.ts`) is a custom tool. It creates the pin at the
  pointer and hands off to `select.translating`, so the pin follows the
  cursor until it is released.
- The pin binds on drop, not on hover. `onTranslateStart` deletes the pin's
  bindings — dragging a pin unpins it — and `onTranslateEnd` binds every
  unlocked shape under the pin's tip: same parent, lower index than the
  pin, and `canBindShapes` agrees.

**Pins do not attach to PDF pages.** The pages are locked, and a binding
target is filtered on `!shape.isLocked`, so a pin dropped on a page binds
nothing.

## Consequences

- The pin is a first-class shape, so it exports, serialises, undoes and
  snapshots like any other. The `toSvg` override is what keeps the emoji in
  an exported image.
- Moving one of two attached shapes moves the other. Moving a shape that
  holds two pins moves both networks it touches.
- Dragging a pin off its targets unpins it, which is the escape hatch the
  behaviour needs: nothing gets stuck.
- The solver runs at the end of an operation rather than on every pointer
  move, so dragging stays cheap. It is a small solver, not a physics engine:
  it relaxes toward the anchors and stops.
- This is more Editor API surface than the example it grew from — a custom
  `ShapeUtil`, a custom `BindingUtil`, the global props maps, the
  `onAfterChangeToShape` / `onBeforeDeleteToShape` / `onOperationComplete`
  hooks, and a custom `StateNode` tool. That surface is the point of the
  task.
- The features have no automated interaction coverage; see 0015. The pin is
  demonstrated in the walkthrough instead.
