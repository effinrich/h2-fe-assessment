# 0017 — The camera exports the region; the crop shape is still open

- Status: accepted
- Date: 2026-10-26

## Context

Task 4 asks for a camera tool. "The tool should create a shape that: 1. lets
the user 'crop' a part of the canvas, 2. then export that part as an image."
The framing is deliberate — it is the same "create a shape that" the pin in
Task 3 asks for — and the demo that came with the brief for this task is
tldraw's own screenshot tool.

That demo is the competitors' reference, and the brief says the demos are
"not our own design" and that the submission should be better than them. The
reference is a good design: drag a box, release, the image is on your disk.
It gets the user their data back in one gesture, which is what the task's
framing is about — "our products don't stop until the user has their data
back to them, in formats that are familiar and universal".

## Decision

**A screenshot tool, and the region exported as a PNG or an SVG.**

- `CameraTool` (`camera-tool.ts`) is a custom `StateNode` with three states —
  idle, pointing, dragging — so a click without a drag is a no-op rather
  than a zero-sized export. The box is drawn by `ScreenshotBox`, registered
  `InFrontOfTheCanvas` so it sits above the document.
- Releasing exports everything under the box, cropped to it. `Ctrl` copies
  the image to the clipboard instead of downloading it, and `Alt` asks for SVG
  rather than PNG.
- What is exported is the _content_ under the box, not a screen region: the
  PDF page, the marks on it and the shapes on top of it are all in the
  image, at the size they are on the canvas.

## The gap

**The camera does not create a shape.** The brief asks for one and this
submission does not deliver it: the crop is exported and nothing is left
behind. Two things follow.

The first is a rubric point. The brief is explicit that there will be no
detailed clarification, that how the gaps are filled is the core of the
exercise, and that the demos are references rather than a design to copy. For
this task the submission currently _is_ the reference.

The second is a product one, and it is not obvious which way to go. A shape
that frames a region and exports it has to show what it frames, or it is
worse than a screenshot: a frame the user cannot see inside is a frame they
have to guess at. A live preview means re-rendering the region as the canvas
changes, and the rest of the app does not pay that cost today — the document
is rasterised once and the marks are vector shapes. The cheaper design is a
shape that _is_ the capture: the crop lands on the canvas as an image, the
user can move it and annotate around it, and the file still goes to the
user.

That is the next change, and it changes the walkthrough: the camera section
of `docs/media.mp4` shows a crop that exports and leaves nothing. It is
recorded here first so the gap is a decision with a reason rather than an
oversight.

## Consequences

- The user gets their data back in one gesture, which is what the task's
  framing asks for. `Ctrl` is the same gesture towards the clipboard, and
  `Alt` is the same gesture towards a vector format.
- SVG is a real second format rather than a promise: the home screen says
  "Export an area as PNG or SVG" and now both are true.
- A crop of a region containing a PDF page contains the page at the size it
  is on the canvas. A crop taken in dark mode carries the dark background
  with it — the same behaviour the walkthrough records for the pages.
- A screenshot cannot be re-edited, and it cannot be re-exported after the
  canvas has changed under it. That is the cost of this design, and it is
  what the next change buys back.
