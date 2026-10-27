# 0011 — features are routes; screens are lib compositions

- Status: accepted
- Date: 2026-10-03

## Context

The strip-down review landed two linked findings. First: the app rendered two
views through one `hasDocument` boolean inside a single component, with a
`BrowserRouter` mounted but never routing — the review asked why there are no
pages/routes at all but at least two distinct views, and named the benefits a
real route layer brings (telemetry, reporting, tracking, ads, chunk
separation). Second: the owner's feature pattern (carried from
their rh-nx-monorepo standard) is more specific than "features are libs": the
route file holds business logic plus a thin wrapper, the entire dumb screen
lives in a lib, and screens are Storybook-tested as compositions.

## Decision

- **Route layer** (`apps/web/src/app`): the route table plus thin per-route
  wrappers — business logic only (busy state, handoff, navigation, retry
  wiring).
- **Feature libs** (`libs/web/features/<route>`): the dumb screen
  (`<route>.tsx`, props in, handlers out, zero fetching) beside per-concern
  siblings: `types.ts`, `consts.ts`, `hooks.ts` (react-query), `utils.ts`,
  `api.ts`, and `partials/` when a section earns it.
- **Web-scoped UI tier** (`libs/web/ui`, `@h2-fe/web-ui`, tags
  `["scope:web","type:ui"]`): route-germane components that are not plausibly
  reusable outside this app — the same structure as `libs/shared/ui`
  (like-named component folders, colocated stories, public barrel, lib-mode
  build) including its own Storybook, which is the **web stage**: its stories
  glob covers this lib and the feature screens' stories, so every web
  composition stages in one place. `libs/shared/ui` keeps its own stage for
  shared primitives only.
- **Promotion ladder for markup**: inline in the screen → a feature
  `partials/<part>.tsx` → `libs/web/ui` when the piece earns a story of its
  own or a second route wants it → `libs/shared/ui` when another app would.
  The story travels with the component at each promotion.
- **Handoff across routes**: the chosen `File` travels through react-router's
  `location.state` (in-memory by reference; structured-clone persisted across
  history entries in real browsers). This refines the plan's earlier intent to
  carry it on the TanStack Query cache: the query cache keeps doing what
  ADR 0002 assigned it — the PDF rasterisation's loading/error/retry — and
  nothing more. A direct link to `/viewer` with no handoff redirects home; a
  refresh re-rasterises the same file because the browser keeps history state.
- The viewer route is `React.lazy`, so tldraw, pdfjs, and `tldraw.css` are not
  in the initial chunk.

## Consequences

- Screens never fetch; they render props and call handler props. Subsequent
  behavior changes land in the wrappers; the screens' shape is a function of
  their props.
- Screen-level coverage is Storybook-first: stories mount screens with props
  alone; colocated jsdom specs cover interactions stories cannot assert.
- The gate gains a second `storybook` stage (the web stage); its
  `build-storybook` cost is accepted. Chromatic project-token decisions for
  the new stages are deferred.
- jsdom needed three polyfills for tldraw-mounted surfaces (`image.decode`,
  `FontFace`, `document.fonts`); they live in `tools/vitest-setup.ts` since
  three projects include it.

## Amendment (2026-10-04): canvas extensions

Not every feature is a route. Pin (task 3) and camera (task 4) add editor
behaviour to the viewer's canvas and have no screen of their own.

- They are still feature libs (`libs/web/features/<name>`, tags
  `["scope:web","type:feature"]`). Instead of a screen, each exports a factory
  returning an object that structurally matches pdf-viewer's
  `CanvasExtension` (`types.ts`, tldraw types only). The siblings never import
  each other: pdf-viewer doesn't import them, and they don't import
  pdf-viewer.
- The route composes them. `pdf-viewer-route.tsx` builds the `extensions`
  array (memoised) and passes it to `PdfViewerScreen`, which type-checks the
  structural match where the libs meet. Predicates that need viewer
  knowledge (`isPdfPageShape`) and viewer hooks (`retainPageBounds`) are
  wired there too.
- `PdfViewerScreen` owns `<Tldraw>`, so it merges extensions: arrays are
  concatenated, overrides are passed as an array, `onMount` handlers are
  composed, and one toolbar and one shortcuts dialog live in its `partials/`.
- Their acceptance stories live in their own lib (`Features/<Name>`, staged
  by web-ui's feature glob) and mount a plain `<Tldraw>` with their
  extension. The viewer's generic seam is covered in pdf-viewer's specs and
  stories with a stand-in extension.

## Amendment (2026-10-04): a feature is a capability, a route is a host

A feature is a capability you can name and ship on its own. A route is a host.
One page may compose many features. This narrows the decision above, which
had paired each route with a feature lib.

- Pin and camera stay sibling feature libs with no route. They still do not
  import pdf-viewer, and pdf-viewer does not import them. The viewer route
  composes them.
- Home is not a feature. Open PDF, the example document, color mode, and the
  empty-state copy are one open-document page. That page is the `/` route in
  `apps/web` (`src/app/routes/home`). It is not folded into pdf-viewer.
  `@h2-fe/home` leaves the project graph.
- pdf-viewer stays a feature: displaying a document on the canvas is a
  capability, and the viewer route hosts it.

## Amendment (2026-10-06): no web-scoped UI tier

`libs/web/ui` (`@h2-fe/web-ui`) held two components and is removed; the
promotion ladder above skips that rung.

- `ViewerTopBar` serves only the viewer, so it moves into pdf-viewer
  (`src/lib/viewer-top-bar/`).
- `AppHeader` is used by `ViewerTopBar` and by the home route. A lib cannot
  import the app, so it moves into pdf-viewer too (`src/lib/app-header/`)
  and pdf-viewer exports it; the app may import features. It is app-branded
  chrome, not a design-system component, so it stays out of `libs/shared/ui`.

## Amendment (2026-10-06): a smaller extension seam

Pin and camera were rebuilt from tldraw's own examples, and pdf-viewer no
longer virtualises pages (ADR 0012). `CanvasExtension` keeps only what they
use: `toolIds`, `shapeUtils`, `bindingUtils`, `tools`, `overrides` and
`InFrontOfTheCanvas`. `overlayUtils`, `onMount` and the route's
`retainPageBounds` wiring are gone, and the pin's `canAttach` option became
"never bind to a locked shape". The extension stories and specs mentioned
above were removed with the rest of the test suite.

### Amendment (2026-10-26): the test harness went too

PR #43 removed the harness itself, so the colocated jsdom specs and
`tools/vitest-setup.ts` named in the Consequences above are gone as well. What
covers behaviour now is the gate and the stories.
