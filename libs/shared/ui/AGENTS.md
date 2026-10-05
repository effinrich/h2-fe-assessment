# `shared-ui`

Design system at `libs/shared/ui`, package `@h2-fe/ui`. Chakra system, `UiProvider`, and component stories. Tokens live here.

## Boundaries

Tags from `nx show project shared-ui`: `scope:shared`, `type:ui`. The root `.oxlintrc.json` allows this library to depend only on `scope:shared`. Do not import `@h2-fe/web-ui`, a feature, or `apps/web`.

`.storybook/main.ts` globs those projects' stories so Chromatic can publish one build. A glob is not an import. Do not add a TypeScript project reference from this library to a feature: those projects already reference this one.

## Targets

`storybook` (port 4400), `build-storybook`, `test-storybook`, `lint`, `test`, `typecheck`, `build`. Play functions are the component tests.

```sh
bunx nx run shared-ui:storybook
bunx nx run shared-ui:build-storybook
```

Verify Chakra APIs against the installed `@chakra-ui/react` types.
