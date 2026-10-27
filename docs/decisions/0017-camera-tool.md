# 0017 — The camera is tldraw's screenshot tool, and that is the decision

- Status: accepted
- Date: 2026-10-26

## Context

Task 4 asks for a camera tool: "The tool should create a shape that: 1. lets
the user 'crop' a part of the canvas, 2. then export that part as an image."

The name needs untangling first, because tldraw has two things it could mean
and only one of them is this task. The SDK exports no camera component. What
the docs call the camera is the viewport camera — `TLCameraOptions` decides
whether it is locked, what the wheel does, how fast it pans and zooms, the
zoom steps, and the constraints that keep it inside a bounded area
([camera-options](https://tldraw.dev/examples/camera-options)). The
crop-and-export primitive is a different thing: the screenshot tool, which
tldraw ships as its own example and backs with the SDK's `exportAs` and
`copyAs` ([screenshot-tool](https://tldraw.dev/examples/screenshot-tool)).

The reference that came with the brief is that screenshot tool, and the brief
is explicit that the demos it ships with are "competitors' references, not
our own design".

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
What ships today is four source files and 163 lines.

## Decision

**Keep tldraw's screenshot tool, wired into the document.**

- `CameraTool` (`camera-tool.ts`) is a custom `StateNode` with three states —
  idle, pointing, dragging — so a click without a drag is a no-op rather than
  a zero-sized export.
- The box is drawn by `ScreenshotBox`, registered `InFrontOfTheCanvas` so it
  sits above the document.
- On release, the shapes whose masked page bounds fall inside the box are
  exported through `exportAs` / `copyAs` with `bounds: box`. What comes out is
  the _content_ under the box, not a screen region: the PDF page, the marks
  on it and the shapes on top of it are all in the image, at the size they are
  on the canvas.
- `Ctrl` copies the image to the clipboard instead of downloading it, and
  `Alt` asks for SVG rather than PNG. The home screen says "Export an area as
  PNG or SVG", and both are true.

## The shape that was not built

The brief asks for a shape, and this leaves none behind: the crop is
exported and nothing stays on the canvas. That is the trade, and the other
side of it is worth stating.

A shape that frames a region and exports it has to show what it frames, or
it is worse than a screenshot — a frame the user cannot see inside is a frame
they have to guess at. A live preview means re-rendering the region as the
canvas changes, and the rest of the app does not pay that cost today: the
document is rasterised once and the marks are vector shapes.

That design is buildable, and the agents built it. Most of what it cost was
the platform already having: the frame's own shape util, its outline, its
export path. What is left of the idea is one line — export the region, and
the region is the image — which is what the shipped tool does.

So the decision is not that the brief's shape is wrong. It is that the shape
was not worth thirty files, and that the honest answer to "the brief asks for
a shape" is to say so rather than to ship something that looks like one.

A reviewer who wants the shape can still build it on top of this tool
cheaply: capture the region, place it on the canvas as an image shape, and
the user can move it and annotate around it. What that does not give is the
live preview — the frame would still be a picture of a region rather than a
window onto one.

## Consequences

- The user gets their data back in one gesture, which is what the task's
  framing is about — "our products don't stop until the user has their data
  back to them, in formats that are familiar and universal". `Ctrl` is the
  same gesture towards the clipboard, and `Alt` the same gesture towards a
  vector format.
- SVG is a real second format rather than a promise.
- A crop of a region containing a PDF page contains the page at the size it
  is on the canvas. A crop taken in dark mode carries the dark background
  with it — the same behaviour the walkthrough records for the pages.
- A screenshot cannot be re-edited, and it cannot be re-exported after the
  canvas has changed under it. That is the cost of this design, stated rather
  than hidden.
- The rule this records is not about the camera. When the platform has a
  supported primitive for the job, use it and go deep on it. A parallel
  implementation is thirty files of code that has to be right before it is
  worth anything, and it is a worse thing to hand a user than the primitive
  it replaced.
- The test for that is whether the code gets there. A less respected library
  or vanilla JavaScript is a fine answer when it is the shortest path to
  working software; a library's reputation is not part of the question. The
  stack in the brief is not the only stack, and reaching for the supported
  path is the part that transfers.
- The wider account of how this repository was worked on, and what the
  process had to become to be trustworthy, is in
  [safeguards.md](../safeguards.md). This is one decision inside it.
