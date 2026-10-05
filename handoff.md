# Handoff

Branch: `fixing-and-cleanup`.

## Run

```sh
bun install
bun run start
```

Dev server port is 4200 (`apps/web/vite.config.mts`). Routes: `/` and `/viewer`.

`bun run storybook` serves `shared-ui` on port 4400. `bun run storybook:web` serves `@h2-fe/web-ui` and does not set a port.

Chromatic publishes `dist/storybook/shared-ui`. That build includes the design system plus feature, chrome, and home stories. The walkthrough is `docs/reviewer.md`.

## Composition

Pin, camera, and pdf-viewer do not import each other. `apps/web` `pdf-viewer-route` composes pin and camera and passes `retainPageBounds={getCropFrameBounds}`.

## Traps

- Locked tldraw shapes: `editor.run(..., { ignoreShapeLock: true })`
- Never update an in-use image asset `src` in place (ADR 0012)
- Chakra for chrome, tldraw CSS vars for canvas UI (ADR 0013)
- oxfmt has no `extends`; do not add a nested `.oxfmtrc.json`
