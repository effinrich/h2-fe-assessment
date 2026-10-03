# 0008 — oxlint for everything except module boundaries

- Status: accepted
- Date: 2026-10-01

## Context

The intent was to move the whole lint configuration to oxlint/oxfmt, which is
faster and is already the toolchain used in the sibling project.

`@nx/enforce-module-boundaries` is an **ESLint** rule. oxlint is Rust-native and
does not load custom JavaScript plugins, so that rule cannot move.

## Decision

**oxlint + oxfmt for the general rule set, and a minimal `eslint.config.mjs`
whose only job is `@nx/enforce-module-boundaries`.**

Boundaries are load-bearing: they are what makes the `scope:`/`type:` tags mean
something, and they fail lint before tests run, which is the earliest useful
feedback an agent can get.

## Consequences

- Two lint tools instead of one. The cost is a config file and a slower lint
  step for one rule.
- The alternative — dropping boundaries to keep a single tool — trades an
  architectural guarantee for tidiness. Declined.
- `@nx/oxlint` requires Nx 23 while the workspace is on 22.7.12, which pulls a
  second `nx` into the tree. Unresolved; see the note in HARNESS.md.

## Addendum — 2026-10-03

Reality overtook this record. `@nx/oxlint` 23 ships `@nx/oxlint/boundaries-plugin`,
an oxlint jsPlugin that runs `@nx/enforce-module-boundaries` *inside* oxlint —
which is exactly what the workspace now does (root `.oxlintrc.json`, error
level). The `eslint.config.mjs` this ADR planned was never created; the rule
moved all the way in, and the two-tools consequence is gone. The reason this
ADR existed ("oxlint is Rust-native and does not load custom JavaScript
plugins") turned out to be outdated rather than impossible. Same fix as
planned — module boundaries as the load-bearing rule — one tool instead of
two.
