# `shared-ui` (`@h2-fe/ui`)

The design system. Chakra UI v3, the `brand` palette, and `UiProvider`. Public API is `src/index.ts`.

Tags: `scope:shared`, `type:ui`. Source here may depend only on `scope:shared`. Do not import a feature, `apps/web`, or `@h2-fe/web-ui`.

Storybook in this project is what Chromatic publishes. `.storybook/main.ts` globs feature, chrome, and home stories so that one build includes them. Those globs are not imports.

From the repo root:

```sh
bunx nx run shared-ui:storybook
bunx nx run shared-ui:build-storybook
bunx nx run shared-ui:test-storybook
bunx nx run shared-ui:lint
bunx nx run shared-ui:test
bunx nx run shared-ui:typecheck
bunx nx run shared-ui:build
```

`storybook` listens on port 4400.
