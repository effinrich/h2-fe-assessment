# `@h2-fe/web-ui`

Web chrome at `libs/web/ui`. `ViewerTopBar` and the web Storybook stage.

## Boundaries

Tags from `nx show project @h2-fe/web-ui`: `scope:web`, `type:ui`. May import `scope:web` and `scope:shared`. Must not be imported by `libs/shared/ui`.

`.storybook/main.ts` globs `libs/web/features/*/src` stories and `apps/web/src/app/routes/home` stories. This library does not import those features. Keep the `build-storybook` and `test-storybook` workspace inputs so a feature-only edit still affects this project. Do not add `implicitDependencies` on the features; that cycles.

## Targets

`storybook`, `build-storybook`, `test-storybook`, `lint`, `test`, `typecheck`, `build`. `storybook` does not set a port.

```sh
bunx nx run @h2-fe/web-ui:storybook
bunx nx run @h2-fe/web-ui:test-storybook
```
