# H2 frontend assessment

A PDF annotation canvas: open a document, mark it, pin shapes together, export a crop.

The five-minute product walkthrough is [docs/reviewer.md](docs/reviewer.md).

## Access

1. Accept an invite to the GitHub repo [effinrich/h2-fe-assessment](https://github.com/effinrich/h2-fe-assessment).
2. Accept an invite to the Chromatic project. That invite is sent from the Chromatic dashboard.

After the Chromatic invite, open the project from the dashboard. This repo does not record a public library URL. `chromatic.config.json` names the project as `Project:6abe484afd9c0c336f0e71fb`.

## Prerequisites

Install [Bun](https://bun.sh). From the repo root:

```sh
bun install
```

Dependencies live only in the root `package.json`. Do not install from an app or library folder.

## Run the app

```sh
bun run start
```

That script is `nx serve @h2-fe/web`. The serve target runs Vite in `apps/web`. The dev server port is **4200** (`server.port` in `apps/web/vite.config.mts`).

- [http://localhost:4200/](http://localhost:4200/) — drop a PDF or open the example
- [http://localhost:4200/viewer](http://localhost:4200/viewer) — the canvas. Opening `/viewer` with no document redirects home.

## Storybook

Design system (`shared-ui`). The `storybook` target sets port **4400** (`libs/shared/ui/project.json`). Nx appends that option to `storybook dev`.

```sh
bun run storybook
```

[http://localhost:4400/](http://localhost:4400/)

This is the Storybook Chromatic publishes. Its `stories` globs include the design system, pin, camera, pdf-viewer, viewer chrome, and the home route.

Web stage (`@h2-fe/web-ui`):

```sh
bun run storybook:web
```

That target is `storybook dev` with no port. The installed CLI does not default `--port` to a fixed number; it prints the URL when it starts.

Static builds, from the repo root:

```sh
bun run build-storybook
bun run build-storybook:web
```

## Chromatic

[Chromatic’s monorepo docs](https://www.chromatic.com/docs/monorepos) give two ways to publish more than one Storybook:

1. **One Storybook.** List every project’s stories in one `.storybook/main.ts`, and publish that build to a single Chromatic project.
2. **One Chromatic project per Storybook.** Add this GitHub repo again in the Chromatic dashboard, name the new project, and put that project’s token on its own CI job. That needs a second project token. This repo does not have one, so that job is not set up.

This repo uses the first method. `.github/workflows/chromatic.yml` runs `bunx nx run shared-ui:build-storybook` and publishes `dist/storybook/shared-ui` with the existing `CHROMATIC_PROJECT_TOKEN`.

## What a reviewer should try

1. Open the example from home. Page 1 is on the canvas. **Previous / Next** and the page field move between pages without redrawing the ones you cannot see.
2. Draw a rectangle. **Open another document** warns before discarding marks. Cancel keeps the canvas.
3. Press **P**, click two overlapping shapes. Drag one: the other follows. Pins do not attach to PDF pages.
4. Press **C**, drag a frame. **Download PNG**, **Copy image**, and **Download SVG** sit on the frame. An empty frame disables the actions.
5. Toggle color mode. Chrome and the canvas follow it. PNG export stays light.

## Stack

Nx 23 + bun · Vite · React 19 · TypeScript strict · Chakra UI v3 · TanStack Query · tldraw 5.5 · Storybook 10 · Vitest

`apps/web` hosts routes. Home is `apps/web/src/app/routes/home`, not a feature library. Feature libraries are `libs/web/features/*`. The design system is `libs/shared/ui` (`@h2-fe/ui`). Pin, camera, and the PDF viewer do not import each other. The viewer route composes pin and camera.

Specs: [docs/specs](docs/specs). Decisions: [docs/decisions](docs/decisions). What was left out: [ADR 0009](docs/decisions/0009-not-built.md).

## Check

```sh
bun run gate
```

That is `nx affected` for lint, format, typecheck, test, build, Storybook build, and Storybook play tests.
