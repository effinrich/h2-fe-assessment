# H2 frontend assessment

A PDF annotation canvas: open a document, mark it, pin shapes together, export a crop.

[Reviewer walkthrough](docs/reviewer.md).

## Run

```sh
bun install
bun run start
```

Then:

- [`/`](http://localhost:4200/) — drop a PDF or open the example
- [`/viewer`](http://localhost:4200/viewer) — the canvas (needs a document in session)

`bun` only, from the repo root. Workspace `package.json` files hold no dependencies.

## What a reviewer should try

1. Open the example from home. Page 1 is on the canvas; **Previous / Next** and the page field move between pages without redrawing the ones you cannot see.
2. Draw a rectangle. **Open another document** warns before discarding marks. Cancel keeps the canvas.
3. Press **P**, click two overlapping shapes. Drag one: the other follows. Pins do not attach to PDF pages.
4. Press **C** (Export area), drag a frame. **Download PNG**, **Copy image**, and **Download SVG** sit on the frame. An empty frame disables the actions instead of exporting nothing.
5. Toggle color mode. Chrome and the canvas follow it; PNG export stays light.

## Better than the demo

The reference videos show the happy path. This build also handles:

- Opening, per-page loading, and document failure with retry
- A cancelable leave warning, and `beforeunload` only while marks exist
- Pin settle-on-rest, undo, and “will not attach” feedback
- Crop export that names the file, stays busy once, and fails with a toast
- Keyboard paths for pin (**P**), crop (**C**, Enter, Esc), and the top bar at 390px

PDF-page shapes are never marks. Crop frames are never in the export.

## What I left out

Recorded in [ADR 0009](docs/decisions/0009-not-built.md). The short list: no backend, no auth, no persistence beyond tldraw’s local store, no SSR, no three.js, no Tailwind. The demo’s “Export PDF” is also out — an export that is not the document would be dishonest.

Specs: [docs/specs](docs/specs). Decisions: [docs/decisions](docs/decisions).

## Stack

Nx 23 + bun · Vite · React 19 · TypeScript strict · Chakra UI v3 · TanStack Query · tldraw 5.5 · Storybook 10 · Vitest

`apps/web` hosts routes. Home is the `/` route in the app (`src/app/routes/home`), not a feature lib. Feature libs live under `libs/web/features/*`. The design system is `libs/shared/ui` (`@h2-fe/ui`). Pin, camera, and the PDF viewer do not import each other; the viewer route composes pin and camera.

## Check

```sh
bun run gate
```

That is `nx affected` for lint, format, typecheck, test, build, Storybook build, and Storybook play tests (including axe).
