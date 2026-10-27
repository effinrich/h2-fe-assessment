# 0017 — The camera is a crop shape, and this is what "done" means

- Status: accepted
- Date: 2026-10-26

## Context

Task 4 asks for a camera tool. "The tool should create a shape that: 1. lets
the user 'crop' a part of the canvas, 2. then export that part as an image."

The framing is deliberate — it is the same "create a shape that" the pin in
Task 3 asks for. The demo that came with the brief for this task is tldraw's
own screenshot tool: drag a box, release, and the image is on your disk.

That demo is a gesture, not a shape. It exports the region and leaves nothing
behind, so the region cannot be adjusted afterwards and it cannot be exported
twice.

The name needs untangling first, because tldraw has two things it could mean
and only one of them is this task. The SDK exports no camera component. What
the docs call the camera is the viewport camera — `TLCameraOptions` decides
whether it is locked, what the wheel does, how fast it pans and zooms, the
zoom steps, and the constraints that keep it inside a bounded area
([camera-options](https://tldraw.dev/examples/camera-options)). The
crop-and-export primitive is a different thing: the screenshot tool, which
tldraw ships as its own example and backs with the SDK's `exportAs` and
`copyAs` ([screenshot-tool](https://tldraw.dev/examples/screenshot-tool)).

## What was built before this decision

Worth recording, because the decision only reads against it.

Four agents worked on task 4 in this repository at once. They built a camera
instead of using the one tldraw ships: a crop frame as a custom `ShapeUtil`,
a frame with its own outline, label, marks and marquee, a toolbar for it, an
export layer with its own action state, a first-use hint, its own types, and
a story per part. The feature reached 36 source files and about 3,400 lines.
None of it reached `main` — it lived in branches and in the working tree.

Pointed at tldraw's supported screenshot tool, the work stopped rather than
changing course.

The history has the rest of it. PR #47 rebuilt the feature from tldraw's
example (29 files, 1,561 lines deleted) and PR #57 took the example as it is.

## The done state

The brief specifies a product, not an implementation, so the first question is
what the product is. These five statements are what task 4 is, and each one
is checkable by looking at the app.

1. **The camera leaves a crop shape behind.** Press `C`, drag on the canvas,
   release: a crop shape stays where the drag was. It is a shape like any
   other — selectable, movable, undoable — and it is still there after the
   export.
2. **The crop is resized from its corners, freely.** The selected crop has
   corner handles. Dragging one moves that corner, and the crop is not locked
   to an aspect ratio: it can be any rectangle.
3. **The crop does not hide what it frames.** The region inside the frame
   stays visible on the canvas. The frame is drawn as corner brackets, not a
   panel over the content, so what will be exported can be seen before it is
   exported.
4. **Exporting the crop produces an image of the region under it.** The export
   is of the content under the crop — the PDF page and the marks on it come
   out together, at the size they are on the canvas, cropped to the crop. It
   is a PNG by default, `Ctrl` copies it to the clipboard instead of
   downloading it, and `Alt` asks for SVG. The home screen's promise,
   "Export an area as PNG or SVG", is true of the crop.
5. **The crop can be exported again.** Exporting does not consume the shape.
   The user can move it, resize it and export again, and the file that comes
   out is the region as it is at that moment.

## Decision

**A custom crop shape, and the platform's own export path.**

- `CropShapeUtil` (`crop-shape-util.tsx`) is a custom shape with `w` and `h`
  props and a `Rectangle2d` geometry, so the region is the shape. It extends
  `BaseBoxShapeUtil`, which brings tldraw's own box resize with it:
  `onResize` delegates to `resizeBox`, so a corner drag scales the region and
  the crop is not aspect-locked. The brackets are drawn by the shape's own
  component, and nothing under the region is covered.
- The camera tool (`camera-tool.ts`) keeps its three states — idle, pointing,
  dragging — and its drag box, but on release it creates the crop shape
  instead of exporting. The shape is selected, so its corner handles are
  there immediately.
- The export is the SDK's: the shapes whose masked page bounds meet the
  region are passed to `exportAs` / `copyAs` with `bounds` set to the region,
  so what comes out is the content under the crop rather than a screen region.
  The crop shapes themselves are left out of the export.
- The export is triggered from the selected crop, in an overlay above the
  canvas: `Ctrl` is the clipboard and `Alt` is SVG, the same two modifiers
  the gesture used.

## Consequences

- The brief's wording is met: the tool creates a shape, the shape crops a part
  of the canvas, and that part is exported as an image. It does more than the
  reference demo, which exports and leaves nothing.
- The crop is a region in page space, not a picture of one. Nothing is
  re-rendered when the canvas changes, so the region costs what a rectangle
  costs, and the export is taken when it is asked for.
- A crop of a region containing a PDF page contains the page at the size it is
  on the canvas. A crop taken in dark mode carries the dark background with
  it — the same behaviour the walkthrough records for the pages.
- The region is not aspect-locked, so a crop can be any rectangle. There is no
  polygonal crop: the brief asks for a shape that crops a part of the canvas,
  and a rectangle is the part.
- The record moves with the decision. An earlier version of this file promised
  a camera shape as the next change, on the grounds that the brief asks for
  one. What the brief asks for is a crop that can be adjusted and exported,
  and that is cheaper to build as the shape itself than to promise in a
  record.
- The wider account of how this repository was worked on, and what the
  process had to become to be trustworthy, is in
  [safeguards.md](../safeguards.md). This is one decision inside it.
