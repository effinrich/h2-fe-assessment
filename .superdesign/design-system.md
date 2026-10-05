# Design system — PDF annotation canvas

## Product context

A PDF annotation canvas (hiring assessment, H2 FE 2026). The brief: "PDF rendering is not only our very
first impression, but a core one throughout the app, as all user interactions happen on top of it."
The reference videos (`docs/demos.md`) are stock tldraw chrome plus one tool each; the brief says
"How you fill the gaps is the core of the exercise." The gaps are missing states: first-run, feedback in
flight, feedback on success, error paths, a second go.

Two routes:

- `/` — open a document. Spec (`docs/specs/task-2-pdf.md`): "Given no document, **the canvas** offers
  'Open PDF' and 'Use an example'." The reference shows that empty state _on the canvas_, not on a
  separate form page.
- `/viewer` — full-bleed tldraw v5 canvas with the PDF pages stacked vertically as locked image shapes.
  tldraw keeps its own toolbar (bottom centre), style panel (top right), zoom/menu (top left / bottom
  left). Our chrome must never share a pixel slot with tldraw's.

Tools added on top of tldraw: **Pin** (`P`, red pushpin that binds overlapping shapes) and **Export area**
(`C`, a persistent dashed crop frame with a contextual toolbar: Download PNG, Copy image, Download SVG).

## Principles

1. **The document is the hero.** Chrome is thin, quiet, and gets out of the way of the page.
2. **One chrome row.** All app chrome lives in a single fixed header above the canvas; the canvas starts
   below it. No floating pills that collide with tldraw's style panel.
3. **Sense of place.** Filename + "Page N of M" always visible; prev/next + jump field.
4. **States are first-class.** Opening, per-page loading, document error + retry, page error + retry,
   unsaved-marks warning — designed, not afterthoughts.
5. **Minimal, not bland.** Precise type, tight spacing, one confident accent, real keyboard hints
   (`kbd`), dotted canvas grid as the brand texture.

## Stack constraints (implementation must map to these)

- Chakra UI v3 — semantic tokens and recipes, `chakra()` factories; no Tailwind, no utility soup.
- tldraw v5 — do not restyle tldraw internals beyond `--tl-color-*` variables; do not hide its UI.
- Color mode: light and dark, both first-class. Canvas follows app color mode.
- WCAG AA contrast on all text and controls; visible focus rings; keyboard reachable.

## Color tokens (existing — keep)

Brand palette is a deep evergreen slate:

| token     | hex       |
| --------- | --------- |
| brand.50  | `#f4f6f4` |
| brand.100 | `#e6ebe8` |
| brand.200 | `#c9d2cc` |
| brand.300 | `#a8b5ae` |
| brand.400 | `#87968e` |
| brand.500 | `#68746e` |
| brand.600 | `#2a3530` |
| brand.700 | `#24302b` |
| brand.800 | `#1c2521` |
| brand.900 | `#151c19` |
| brand.950 | `#0c110f` |

Semantic (light / dark): `brand.solid` 600/600 · `brand.fg` 700/300 · `brand.subtle` 100/900 ·
`brand.muted` 200/800 · `brand.contrast` white · `brand.focusRing` 500/400 · `fg.error` red.600/red.400.
Chakra defaults otherwise: `bg` white / `#09090b`, `bg.panel` white / gray.950, `bg.muted`
gray.100 / gray.900, `border` gray.200 / gray.800, `fg` gray.950 / gray.50, `fg.muted` gray.600 / gray.400.

Signal colors already on canvas: pin head red (tldraw red), crop frame dashed `brand.fg` with
`brand.solid` corner marks and a `brand.solid` size label.

## Type

System sans stack today (Chakra default). Proposed upgrade: **Inter** (UI) + **JetBrains Mono** (page
numbers, kbd, file sizes) — tabular numerals for "Page 3 of 12".
Scale: 12 (meta/kbd) · 13 (chrome labels) · 14 (body) · 16 (lead) · 24 (empty-state title) · 32 (hero, home only).
Weights: 400 / 500 / 600. Letter-spacing −0.01em on headings.

## Space, radius, elevation

- 4px base grid. Header height 48px. Control height 32px (sm). Gaps 8 / 12 / 16 / 24.
- Radius: 6px controls, 10px panels/cards, 999px for page pill and kbd chips.
- Elevation: chrome is flat with a 1px `border` hairline; only floating panels (modal, page error card,
  first-use hint) get `shadow.lg`.

## Canvas texture

Dotted grid: 1px dots, 20px pitch, `border` color at ~60% — used on the home empty state so `/` already
_is_ the canvas, and matches tldraw's grid when it's enabled.

## Components we own

- **AppHeader** (both routes): wordmark left; on viewer: filename (truncate, `title` tooltip) + page
  navigator (‹ [ 3 ] / 12 ›, mono tabular digits) centre; color-mode toggle + "Open another" right.
- **EmptyCanvas** (home): dotted canvas, centred drop zone card with "Open PDF" (solid) and "Use an
  example" (ghost/outline), "or drop a PDF anywhere", and a quiet row of tool hints (`P` Pin, `C` Export
  area, `V` Select).
- **States**: full-surface opening spinner with filename + "Rendering page 1…"; document error card with
  "Try again"; page-sized placeholder with spinner; page error card "Retry page N"; discard-marks modal.
- **First-use hints** (existing): one-line pill near the bottom toolbar, `kbd` chips, Esc to dismiss.
