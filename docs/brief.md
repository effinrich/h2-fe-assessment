# The brief, and where each task landed

H2's frontend coding exercise asked for four tasks in an app built around a
tldraw-powered canvas, and for three things besides working code. This page
restates the brief so a reviewer can score the submission against it, and
points at the code and at the record for each task.

The three demos that came with the brief are the competitors' references. The
brief is explicit that they are "not our own design" and that the submission
should be better than them, so each task below says where this one sits
against them.

## What the brief asked for

**Product sense.** "How you fill the gaps is the core of the exercise." Looked
at: ease of use, design consistency, user experience.

**Engineering.** AI is allowed and is not counted as a plus. "State-of-the-art
AI attempts on this exercise is our very baseline … it's all about your
differences on top of that." Looked at: system design, code consistency,
modern practices.

**Teamwork.** "Any AI can deliver code, so we want to see your decisions,
thoughts, and overall how you would communicate and collaborate with other
team members, especially in an asynchronous and fast moving environment." The
brief names the evidence it likes: a walkthrough recording, decision notes,
session transcripts with AI agents.

### The four tasks

| #   | The brief asked for                                                                                           | Where it is                                                                   | The record                                                                                                                                                                                                                    |
| --- | ------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 1   | A new repository — opinions on package management, code formatting, folder structure                          | `apps/`, `libs/`, `nx.json`, `package.json`, `lefthook.yml`, `.oxlintrc.json` | [0001](decisions/0001-workspace-and-package-manager.md), [0002](decisions/0002-framework.md), [0008](decisions/0008-lint-split.md), [0011](decisions/0011-feature-pattern.md), [0014](decisions/0014-chakra-over-tailwind.md) |
| 2   | Display a PDF, with the tradeoffs and optimisations visible                                                   | `libs/web/features/pdf-viewer`, the open-document screen in `apps/web`        | [0012](decisions/0012-pdf-pages-as-image-shapes.md)                                                                                                                                                                           |
| 3   | A pin tool: deep Editor API integration; a shape that looks like a pin; two shapes under one pin are attached | `libs/web/features/pin`                                                       | [0016](decisions/0016-pin-tool.md)                                                                                                                                                                                            |
| 4   | A camera tool: a shape that crops part of the canvas, then exports that part as an image                      | `libs/web/features/camera`                                                    | [0017](decisions/0017-camera-tool.md)                                                                                                                                                                                         |

## Task 1 — the repository

The brief asks for opinions on three things, and for them to be visible.

**Package management** is Bun in an Nx monorepo: one tool, one lockfile, and
Nx over folders so a library is a project rather than a directory
convention. That is 0001, and it decides the rest.

**Formatting and lint** are oxfmt and oxlint, split so the fast check runs on
everything and the slow one runs on what changed. The lint is type-aware,
and the module boundaries are enforced inside it rather than by a script.

**Folder structure** is one project per capability, tagged, with the tags
enforced: `scope:shared` may import only `scope:shared`, so the design
system can never reach into the application.

None of that is a default. The brief's own framing is that the reflex is
Tailwind and shadcn, and that the reflex is the thing to avoid — 0014 is the
record of choosing Chakra v3 over it, and 0004 is the record of what it
replaced.

**Verified by** the gate. `bun run gate` runs the size budget, the guardrail
check, and `nx affected` over lint, format, typecheck, build and
build-storybook, so what runs is derived from the project graph rather than
from a list somebody edits.

## Task 2 — the document

**The brief asks for the tradeoffs and optimisations to be visible, especially
for performance.** 0012 is that visibility: three ways to put a PDF on a
tldraw canvas, a table of what each one costs in memory, sharpness, export
and bindings, and a decision.

The decision is to rasterise. Each page is rendered once through pdfjs, at
2x, and placed on the canvas as a locked image shape. An earlier draft
promised a per-page DOM element instead; the amendment records why that was
dropped — its headline guarantee, never being unmounted by culling, is the
opposite of what a long document needs — and it records the cost the other
way too: memory now grows with the page count rather than with the viewport,
which is acceptable for documents of tens of pages and is not acceptable for
long ones.

**The product around it** is the part the reference demo does not have. The
demo's start screen is two buttons. This one is a card that says what is
going to happen — pages render on an infinite canvas, everything stays in
your browser — with a drop-anywhere affordance, a keyboard hint row, and a
toast when the file is not a PDF. Opening another document warns before
discarding marks, and cancelling keeps the canvas.

**Against the reference:** the demo renders the brief's own text as live type
in the canvas and offers an "Export PDF" button. This one rasterises, which
is cheaper to draw, and the cost of that is written down in 0012 rather than
left to be noticed. The way back to a PDF came afterwards, in 0018: the file
that comes out is the source PDF with the marks on top, so the document in it
is still text rather than a picture of text.

**Verified by** the type system, the boundary rules, and the walkthrough.

## Task 3 — the pin

**The brief asks for deep integration with the Editor API, and for a shape
that looks like a pin and attaches the shapes under it.** 0016 is the record.

This is the most Editor API surface in the submission: a custom `ShapeUtil`
for the pin, a custom `BindingUtil` carrying a normalised anchor, a
relaxation solver that resolves the whole connected network rather than one
pair at a time, a custom `StateNode` tool, and the global props maps that
teach the editor the binding type.

Two behaviours are decisions rather than features. Dragging a pin **unpins**
it, and dropping it **binds every unlocked shape under its tip** — so the
brief's case, two overlapping shapes that move together, is what you get,
and a chain of five shapes through two pins resolves the same way. And pins
do not attach to PDF pages, because the pages are locked and a pin that
dragged the document around would be a bug.

**Against the reference:** the demo for this task is tldraw's own
[pin-bindings example](https://tldraw.dev/examples/pin-bindings) in a bare
canvas. This is a different implementation, in the application, where the
shapes it holds can be pages of a document.

**Verified by** the walkthrough, which draws two overlapping shapes, pins
them where they overlap, and moves one.

## Task 4 — the camera

**The brief asks for a tool that creates a shape, crops part of the canvas
and exports that part as an image.** 0017 is the record, and it holds the done
state for the task: five statements, each checkable by looking at the app.

What ships is a crop shape. Press `C`, drag on the canvas, and the drag is
left behind as a shape — corner brackets around a region, selectable and
movable like any other, resized from its corners and not locked to an aspect
ratio. The brackets are drawn rather than filled, so the region stays
visible: what will be exported can be seen before it is exported.

Exporting is an action on the crop. It writes out the content under the
region — the PDF page and the marks on it, at the size they are on the
canvas, cropped to the crop — as a PNG, or to the clipboard with `Ctrl`, or
as SVG with `Alt`. The crop stays where it is afterwards, so it can be
adjusted and exported again.

**The document comes back too.** The brief's task 4 asks for the user's data
back "in formats that are familiar and universal", and the camera answers
that for a region of the canvas. The document itself answers it in 0018: the
header has an Export PDF button, and what it writes is the source PDF with
the marks on top — the document is still text, and the marks are a layer
over it.

**Against the reference:** the demo that came with the brief is tldraw's
[screenshot tool](https://tldraw.dev/examples/screenshot-tool), and the brief
is explicit that the demos are "not our own design" and that the submission
should be better than them. The demo exports the region and leaves nothing
behind; this leaves the region on the canvas, where it can be moved, resized
and exported again.

## The three expectations

**Product sense** is answered by the open-document screen, the design system
in `libs/shared/ui`, the toast that refuses a file that is not a PDF, the
warning before marks are discarded, the colour mode that follows the canvas,
and the fact that the document never leaves the browser.

**Engineering** is answered by the repository above, by the gate that derives
its own targets, by the unit tests it runs, by the boundaries enforced in
lint, and by the decision records — including the ones that record a decision
_not_ to do something.

**Teamwork** is answered by a narrated walkthrough of the product, by sixteen
decision records, by the commit history, which names the agent that had a
hand in each commit, and by the [session transcripts](transcripts/README.md) —
the record of the work as it happened. It is also answered by the record of
what went wrong: 0017 tells the camera from both ends — four agents building
a frame and an export pipeline of their own, a directive that did not land,
and the decision that followed — and [safeguards.md](safeguards.md) is the
wider account of the same period and of what the process had to become to be
trustworthy.

## Where this is behind

Nothing the brief asked for is missing now. The four tasks are answered
above, and the evidence it names is here: the walkthrough, the decision
records, the commit history and the session transcripts.

What is left are the trade-offs the records name, and they are named rather
than hidden. The canvas is rasterised, so a long document costs memory in
proportion to its page count (0012). There is a unit test loop over the logic
that has no DOM in it (0019), and the editor, the canvas and the React tree
are still not covered, because a test of those needs a DOM. And the
collaboration went through a period in which a compromised machine and a set
of agents that disagreed with each other cost real time:
[safeguards.md](safeguards.md) has that account, and the transcripts have the
raw material behind it.
