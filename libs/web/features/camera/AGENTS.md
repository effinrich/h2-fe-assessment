# `@h2-fe/camera`

Feature at `libs/web/features/camera`. A canvas extension, not a route. Files are grouped by concern: `camera.tsx` and the extension wiring (`crop-frame-creation.ts`, `crop-shortcuts.ts`, `export-actions.ts`, `consts.ts`, `types.ts`) stay in `src/lib/`. Every class lives in `classes/`, one file each, exported through `classes/index.ts`; consumers import from `./classes`, siblings inside it import each other directly. The `camera-*.stories.tsx` files and their harness (`camera-story-canvas.tsx`, `camera-story-toolbar.tsx`, `story-helpers.ts`) live in `stories/`. Each other concern (`utils`, `crop-frame`, `crop-export`, `first-use-hint`, `style-panel-guard`, `crop-frame-toolbar`) is its own folder with its spec beside the implementation.

## Boundaries

Tags from `nx show project @h2-fe/camera`: `scope:web`, `type:feature`. The linter allows other `scope:web` imports. Do not import `@h2-fe/pin` or `@h2-fe/pdf-viewer`. They must not import this library.

## Targets

`lint`, `test`, `typecheck`, `build`. No `storybook` target. Stories here are globbed by `shared-ui` and `@h2-fe/web-ui`.

```sh
bunx nx run @h2-fe/camera:test
bunx nx run @h2-fe/camera:typecheck
```
