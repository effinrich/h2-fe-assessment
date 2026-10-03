# `libs/shared/ui` — the design system

Local rules. The root `AGENTS.md` still applies; this is what is specific here.

## What this is

A publishable Nx library built on Chakra UI v3. It owns the Chakra system
(`createSystem` over `defaultConfig`, with the `brand` palette), the `UiProvider`
that apps and Storybook wrap their trees in, and composites over Chakra's
compound components. It is the only place design tokens live. Verify Chakra APIs
against `node_modules/@chakra-ui/react/dist/types`; v3 differs heavily from v2.

## Boundaries

- Tags: `scope:shared`, `type:ui`. The enforced constraint is the tag rule:
  this library may depend only on other `scope:shared` libraries — it may not
  import a feature lib or an app, and `@nx/enforce-module-boundaries` fails
  lint if it does.
- Enforced by the root `.oxlintrc.json`: the `@nx/oxlint/boundaries-plugin`
  jsPlugin runs the rule inside oxlint (ADR 0008's addendum is the record of
  how reality overtook that ADR's original plan). The `type:*` tags are
  intent, not enforcement — the depConstraints carry only the two `scope:`
  rules (`scope:shared` → `scope:shared`; `scope:web` → `scope:web` +
  `scope:shared`).

## Truth lives in the tools, not in this file

- **Nx behaviour** — ask the graph: `nx show project shared-ui`,
  `nx show project shared-ui --json` for inferred targets and tags. Do not read
  `project.json` and infer; it is intentionally sparse.

## Rules

1. **Every component has a story.** `nx g @nx/react:stories --project=@h2-fe/ui`
   generates them for the whole directory. Stories are the test surface: play
   functions assert behaviour, and Chromatic diffs the rest.
2. **File naming follows the feature-based-architecture skill**: kebab-case, one
   component per file, sibling `types.ts` / `consts.ts` / `hooks.ts` / `utils.ts`.
   Storybook is the one exception allowed beside a component (`ui.stories.tsx`).
