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
