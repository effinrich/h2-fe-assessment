# h2-fe-assessment — handoff

Branch: `fixing-and-cleanup`. Product work for the hiring zip is in.

## State

Tasks 1–4 are implemented: home, PDF viewer, pin, camera (export area). Theme is a quiet olive-ink palette in `libs/shared/ui/src/lib/theme/system.ts`. Reviewer README is the root `README.md`.

Pin, camera, and pdf-viewer do not import each other. `apps/web` `pdf-viewer-route` composes `createPinExtension` + `createCameraExtension` and passes `retainPageBounds={getCropFrameBounds}`.

## Verify

```sh
bun install
bun run start          # / and /viewer
bun run gate
```

Storybook: `bun run storybook` (shared-ui, :4400), `bun run storybook:web` (web-ui + feature stories, :6006).

## Leftovers (not this zip)

- Walkthrough video
- Chromatic project for `@h2-fe/web-ui` (workflow still snaps `shared-ui`)
- Scheduled Task 2 extras (full-PDF export, more chrome) — see spec debts
- Home-as-feature vs host — left as a route-screen lib (ADR 0011)

## Traps

- Locked tldraw shapes: `editor.run(..., { ignoreShapeLock: true })`
- Never update an in-use image asset `src` in place (ADR 0012)
- Chakra for chrome, tldraw CSS vars for canvas UI (ADR 0013)
- oxfmt has no `extends`; do not add nested `.oxfmtrc.json`
- Ask before deleting config files
