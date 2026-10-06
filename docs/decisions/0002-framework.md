# 0002 — Vite SPA, not TanStack Start

- Status: accepted
- Date: 2026-10-01

## Context

TanStack Start (TanStack Router + SSR + server functions on Vite) was
considered, along with Next.js.

The app is a canvas: tldraw in a single route, plus PDF rendering (Task 2) and
client-side image export (Task 4). There is no server-side data, no SEO surface,
and no second route.

## Decision

**Vite + React SPA.** No SSR, and no router — one route does not need one.

**TanStack Query stays.** It earns its place on the PDF fetch and paging and on
the export job, where loading, error and retry are real states that stories can
then assert. It is not used for local UI state, and saying so is part of the
decision.

## Consequences

- SSR would mean guarding every tldraw and PDF mount against a server render,
  for no benefit.
- Adopting Start later is a routing-layer change, not a rewrite.

## Amendment — 2026-10-03 (the router went live)

React Router was a dependency from day one but `BrowserRouter` mounted with
zero `<Routes>`; the app was one component switching views on a boolean. The
strip-down review promoted the two views into routes ("wouldn't the first
overlay be its own route" was right) for telemetry, ads, chunk separation, and
so one React file does not hold the entire app.

- `/` — the home route: the former empty-state card as a real page
  (`libs/web/features/home`).
- `/viewer` — the document canvas, lazy-loaded so tldraw, pdfjs, and
  `tldraw.css` leave the initial chunk (`libs/web/features/pdf-viewer`).
- Layering and the screen pattern: ADR 0011.
- Static-host note: CI is gate-only today; when a static host serves this SPA,
  `/viewer` deep refreshes need a fallback rewrite to `index.html`.

"No SSR" still holds; "no router" is replaced by this amendment. TanStack
Query keeps the duties assigned above (PDF fetch/paging and export jobs), now
including the rasterisation query the canvas route consumes.
