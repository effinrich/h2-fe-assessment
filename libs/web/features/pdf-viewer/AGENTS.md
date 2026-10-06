# `@h2-fe/pdf-viewer`

Feature at `libs/web/features/pdf-viewer`. The screen and the PDF-page shapes. `apps/web` composes pin and camera onto it. Classes live in `src/lib/classes/`.

## Boundaries

Tags from `nx show project @h2-fe/pdf-viewer`: `scope:web`, `type:feature`. The linter allows other `scope:web` imports. Do not import `@h2-fe/pin` or `@h2-fe/camera` anyway. Do not let those features import this one.

## Targets

`lint`, `test`, `typecheck`, `build`. No `storybook` target. Stories in this library are globbed by `shared-ui` and `@h2-fe/web-ui`.

```sh
bunx nx run @h2-fe/pdf-viewer:test
bunx nx run @h2-fe/pdf-viewer:typecheck
```
