# `libs/shared/ui` — the design system

Local rules. The root `AGENTS.md` still applies; this is what is specific here.

## What this is

A publishable Nx library built on Chakra UI v3. It owns the Chakra system
(`createSystem` over `defaultConfig`, with the `brand` palette), the `UiProvider`
that apps and Storybook wrap their trees in, and composites over Chakra's
compound components. It is the only place design tokens live. Verify Chakra APIs
against `node_modules/@chakra-ui/react/dist/types`; v3 differs heavily from v2.

## Boundaries

- Tags: `scope:shared`, `type:ui`. This library may import **only** other
  `type:ui` and `type:util` libraries, and only `scope:shared`. It may not import
  a feature lib or an app. `@nx/enforce-module-boundaries` fails lint if it does.
- Enforced by `.eslintrc`-equivalent in the root `eslint.config.mjs`, which is the
  one rule that cannot move to oxlint (ADR 0008).

## Truth lives in the tools, not in this file

- **Nx behaviour** — ask the graph: `nx show project @h2-fe/ui`,
  `nx show project @h2-fe/ui --json` for inferred targets and tags. Do not read
  `project.json` and infer; it is intentionally sparse.

## Rules

1. **Every component has a story.** `nx g @nx/react:stories --project=@h2-fe/ui`
   generates them for the whole directory. Stories are the test surface: play
   functions assert behaviour, and Chromatic diffs the rest.
2. **File naming follows the feature-based-architecture skill**: kebab-case, one
   component per file, sibling `types.ts` / `consts.ts` / `hooks.ts` / `utils.ts`.
   Storybook is the one exception allowed beside a component (`ui.stories.tsx`).
