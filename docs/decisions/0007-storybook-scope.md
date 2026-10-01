# 0007 — Every UI component storied; screens only in meaningful states

- Status: accepted
- Date: 2026-10-01

## Context

Storybook and Chromatic are expected here — the brief is graded partly on design
consistency, and visual regression is how that is kept honest. The temptation is
to claim full coverage.

## Decision

- **Storybook lives per library** (`libs/shared/ui/.storybook`), never at the
  repo root, wired through `@nx/storybook/plugin` so `build-storybook` and
  `test-storybook` are cached Nx targets.
- **Every `type:ui` component gets a story.** Cheap, and it means interaction
  testing and Chromatic cover the component surface without extra work.
- **Screens get stories only in meaningful states** — empty, loading, error, one
  shape, many. Storying a live tldraw canvas needs editor providers and fixtures,
  and claiming full screen coverage would be dishonest.
- Every story is wrapped in a `QueryClientProvider` decorator with a stub client,
  so no story touches the network and Chromatic snapshots stay deterministic.

## Consequences

- Interaction assertions live in play functions, so they run under the Storybook
  test runner and Chromatic rather than in a separate e2e suite.
- Chromatic needs a token and CI. If that cannot be wired, the Storybook
  test-runner still covers interaction, and that is stated rather than silently
  dropped.
