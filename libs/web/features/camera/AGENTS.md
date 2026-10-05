# `@h2-fe/camera`

Feature at `libs/web/features/camera`. A canvas extension, not a route.

## Boundaries

Tags from `nx show project @h2-fe/camera`: `scope:web`, `type:feature`. The linter allows other `scope:web` imports. Do not import `@h2-fe/pin` or `@h2-fe/pdf-viewer`. They must not import this library.

## Targets

`lint`, `test`, `typecheck`, `build`. No `storybook` target. Stories here are globbed by `shared-ui` and `@h2-fe/web-ui`.

```sh
bunx nx run @h2-fe/camera:test
bunx nx run @h2-fe/camera:typecheck
```
