# `@h2-fe/pin`

Pin tool for the viewer canvas. `createPinExtension` is the public entry. The viewer route in `apps/web` mounts it.

Tags: `scope:web`, `type:feature`. Do not import `@h2-fe/camera` or `@h2-fe/pdf-viewer`.

This project has no Storybook target. Its stories are included by `shared-ui` and `@h2-fe/web-ui`.

## Public API

From `src/index.ts`:

- `createPinExtension(options?)`: returns a `PinExtension`, structurally a `CanvasExtension`. `options.canAttach(shape)` adds an eligibility rule; the route uses it to keep pins off PDF pages.
- `PIN_TOOL_ID`: the tool id (`"pin"`). Shortcut: **P**.
- Types: `PinExtension`, `PinExtensionOptions`.

See the [`CanvasExtension` reference](../../../../docs/reference/canvas-extension.md) and the [spec](../../../../docs/specs/task-3-pin.md).

From the repo root:

```sh
bunx nx run @h2-fe/pin:lint
bunx nx run @h2-fe/pin:test
bunx nx run @h2-fe/pin:typecheck
bunx nx run @h2-fe/pin:build
```
