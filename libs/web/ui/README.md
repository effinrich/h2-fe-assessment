# `@h2-fe/web-ui`

App chrome that is not a shared primitive. Today that is `ViewerTopBar`. Package exports are `src/index.ts`.

Tags: `scope:web`, `type:ui`. It may import `scope:web` and `scope:shared` (`@h2-fe/ui`). `libs/shared/ui` must not import this library.

Its Storybook also globs feature stories and the home route. Chromatic does not publish this build. The published build is `shared-ui`.

From the repo root:

```sh
bunx nx run @h2-fe/web-ui:storybook
bunx nx run @h2-fe/web-ui:build-storybook
bunx nx run @h2-fe/web-ui:test-storybook
bunx nx run @h2-fe/web-ui:lint
bunx nx run @h2-fe/web-ui:test
bunx nx run @h2-fe/web-ui:typecheck
bunx nx run @h2-fe/web-ui:build
```

`storybook` is `storybook dev` with no port. The CLI prints the URL.
