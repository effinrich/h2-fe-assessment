# 0004 — Panda CSS with Ark UI via Park UI

- Status: accepted
- Date: 2026-10-01

## Context

Tailwind with shadcn is the default reflex, and it is also what most AI-assisted
submissions will use. The brief states that state-of-the-art AI attempts are
"our very baseline", so the reflex is the thing to avoid.

Two candidates: Panda CSS + Ark, or a tight shadcn library with classnames
abstracted into custom components.

## Decision

**Panda CSS for styling, Ark UI for behaviour, adopted through Park UI.**

- Panda is build-time and zero-runtime, but the deciding property is that it is
  **typed**. `css()` and the recipe API produce typed variants, so a misspelled
  token or variant is a TypeScript error and the gate catches design-system
  drift the same way it catches broken types. Tailwind class strings are
  verifiable by nothing but a human eye.
- Ark's own docs recommend Panda, naming `defineSlotRecipe` for styling a
  component's parts and variants. The two layers are designed together.
- Park UI is the shadcn shape on that pair: copy-in components we own, typed.

## Consequences

- **The honest cost:** Ark and Park UI are far less represented in training data
  than Radix, so API invention is likelier. That is `verifier`'s job, and it is
  the reason the gate exists rather than a reason to avoid the better library.
- Both the app's Vite config and Storybook's need the Panda plugin, or stories
  compile unstyled. Storybook inherits the lib's config via `viteConfigPath`.
