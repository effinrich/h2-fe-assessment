# Task 2 — display a PDF

- Status: draft
- Brief reference: README.pdf §2, task-2.mp4

## What the brief asks

> "**Task 2, we need to display a PDF.** PDF rendering is not only our very first
> impression, but a core one throughout the app, as all user interactions happen
> on top of it. We want to see how you make tradeoffs and optimisations,
> especially in terms of performance."

The last clause is the task. Rendering a PDF is a solved problem; rendering one
_inside an infinite canvas without it being the thing that makes the canvas
slow_ is the engineering being assessed.

## What the demo does

From `docs/demos.md` — OCR of the video, so labels and sequence are reliable and
spatial detail is not:

| Time     | Observed                                                           |
| -------- | ------------------------------------------------------------------ |
| 0.0–1.0s | Empty state, two controls: **"Open PDF"** and **"Use an example"** |
| 1.5–2.0s | macOS file picker, selects `Dummy (1).pdf`                         |
| 2.5s+    | The PDF renders in the canvas                                      |

Controls while viewing: **`S` `M` `L` `XL`**, **`Export PDF`**, a **`Page 1`**
indicator. Everything else visible is stock tldraw chrome.

## What we do differently, and why

The demo is the happy path. Three specific improvements, in order of how much
they matter:

1. **Render the PDF once, not per frame.** tldraw's `getAppOwnedElement` +
   `onReleaseAppOwnedElement` guarantee that element is never unmounted,
   recreated or relocated across reparenting, culling and re-renders — it uses
   `Node.moveBefore` so stateful content keeps its state. The document mounts
   once and pan, zoom and reshape never touch it. This is the performance answer,
   and it is a citable API rather than a hopeful optimisation.
2. **Page virtualisation.** Only visible pages are rasterised. A 300-page
   document must not cost 300 renders.
3. **States the demo omits.** Loading, failure with retry, and a bad file. The
   demo has none of them, and a PDF that silently fails to load is the worst
   first impression available.

`canCull` is left at its default and verified rather than overridden — the
brief's own chrome culls off-screen shapes, and turning that off to fix a
symptom would be the wrong trade.

## Acceptance criteria

Falsifiable, each with the test that proves it. Test-first: the test is written
and committed failing before the code exists.

- [x] **Given no document, the canvas offers "Open PDF" and "Use an example".**
      — now `libs/web/features/home/src/lib/home.spec.tsx` (red `edf477a`,
      green `ac2b31d`); the interface moved from the empty-state card to the
      routed home page in the rebuild — see ADR 0011.
- [x] **Choosing a file renders its first page inside a shape on the canvas.**
      — verified by hand in the browser: both pages land as locked image shapes
      and survive pan/zoom. Not unit-testable in jsdom, since rasterising needs
      a real canvas; the pure seams around it are covered instead.
- [ ] **The renderer element is mounted exactly once across pan, zoom, resize and
      reparent.** Assert by DOM node identity and mount count, not by inspecting
      implementation. — `pdf-document-mount-once.spec.tsx`
- [ ] **While the file is being read, a loading state is visible at the shape.**
      — `pdf-document-loading.spec.tsx`
- [ ] **An unreadable or corrupt file shows an error with a working retry.**
      — `pdf-document-error.spec.tsx`
- [ ] **Page navigation moves between pages without remounting the renderer.**
      — `pdf-document-pagination.spec.tsx`
- [ ] **Only visible pages are rasterised.** A 100-page document mounts a number
      of page nodes bounded by the viewport, not by the page count.
      — `pdf-document-virtualisation.spec.tsx`

## States

| State    | Handled | How                                                                  |
| -------- | ------- | -------------------------------------------------------------------- |
| Empty    | yes     | Two controls, named in the criterion above                           |
| Loading  | yes     | Skeleton at the shape's bounds, through Query so it is modelled once |
| Error    | yes     | Message plus retry; the dump/file is not lost                        |
| Success  | yes     | The page renders                                                     |
| Disabled | yes     | Open/Save disabled with no file selected                             |
| Overflow | yes     | 100+ page document; long filename truncates                          |

## Test strategy

Honest about what can be proven where, because jsdom cannot rasterise a PDF:

- **Component and logic tests (Vitest + jsdom):** everything above. The renderer
  is stubbed, so the tests assert _our_ behaviour — mount count, state
  transitions, virtualisation bounds — not the PDF library's correctness.
- **Interaction (Storybook play functions):** open, navigate, resize. Runs under
  the Storybook test runner and Chromatic.
- **Visual (Chromatic):** the empty, loading, error and success states, so a
  regression in any of them is a diff rather than a discovery.

## Viewer workspace acceptance (product review)

- [ ] A visible multi-page PDF identifies its filename and shows the current page out of the total; previous, next, and a bounded 1-based page jump move the canvas without rasterising the entire PDF.
- [ ] A visible page shows loading feedback until its image is ready. A failed page has a page-specific retry that succeeds without clearing other pages, unmounting tldraw, or destroying the document; an invalid PDF retains the document-level error and retry.
- [ ] Independent canvas marks survive page virtualization and page retry. PDF placeholder shapes and assets alone never count as unsaved marks.
- [ ] With unsaved marks, “Open another document” offers a cancelable warning; without marks it exits directly. Browser refresh/close prompts only while marked, where the browser supports it. Neither flow claims marks are persisted.
- [ ] Filename truncation, page controls, loading and error feedback remain legible and keyboard-accessible at narrow widths; tldraw's own tool and zoom controls are not duplicated.

These are enhancements, not controls mandated by the demo. Persistence across refresh, thumbnails, outline, and annotated-PDF export are deferred.

## Out of scope

- **Editing or annotating the PDF.** The brief asks to display it; tldraw's own
  tools sit on top, which is the point of the canvas.
- **A PDF library choice made now.** `pdfjs-dist` is the likely answer; the
  decision gets its own ADR when it is made, with the bundle-size trade-off
  recorded rather than assumed.
- **Server-side rendering of pages.** No server. See ADR 0002.
- **Password-protected documents.** Named here so the absence is a decision.

## Open questions

- Whether the PDF should be a tldraw _asset_ (via `handledAssetTypes` and
  `createShapeForAsset`, so dropping a file on the canvas works) or a shape
  created by an explicit action. The demo uses a picker; drag-and-drop is a
  better affordance and the API supports it. Decided when the shape is built.
