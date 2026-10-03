# 0010 — NX trims: verification protocol and ledger

- Status: accepted
- Date: 2026-10-03

## Why this file exists

Trimming nx-adjacent dependencies or config is the class of change that breaks
scaffolding or the task graph without failing a build. So no change lands on a
title that looks unused: each is verified against the protocol below and gets
its own entry here, written as it lands.

## Protocol — for every nx config or `@nx/*` change

1. `bunx nx reset` — graph recomputed from disk truth.
2. `bunx nx show projects` before/after; the set is unchanged unless intended.
   Baseline (verified 2026-10-03): `@h2-fe/web`, `@h2-fe/importers`,
   `shared-ui`, `@h2-fe/source`.
3. `bunx nx graph --file=...` still parses.
4. Targeted greps across `nx.json`, all project/package jsons, vite configs,
   and workflows.
5. Full `bun run gate` (lint, oxfmt, typecheck, test, build, build-storybook);
   the gate's `shared-ui:build-storybook` run doubles as the explicit
   babel/storybook probe.
6. For `generators."@nx/react"` edits: `bunx nx g @nx/react:lib tmp-probe
   --dry-run` (names with leading underscores are invalid; dry-run makes no
   changes) — the plan must still show `.oxlintrc.json` and `vite.config.mts`.

## Entries

### Entry 1 — the declarative babel pipeline comes out

- Date: 2026-10-03
- Change:
  - Deleted `libs/shared/ui/.babelrc` and
    `libs/web/features/importers/.babelrc` (byte-identical 12-line files:
    `@nx/react/babel` preset, runtime automatic, useBuiltIns usage).
  - Edited the `nx.json` `generators."@nx/react".application` value: removed
    `"babel": true`. The generators block itself stays — deleting it wholesale
    would revert `nx g` to eslint defaults and scaffold oxlint-hostile configs.
- Evidence: builds run through Vite 8/Rolldown + `@vitejs/plugin-react`;
  Storybook's builder is `@storybook/react-vite` (`main.ts` points at the
  lib's `vite.config.mts`); no executor, plugin, script, or workflow references
  `@nx/react/babel`; `apps/web` never had a `.babelrc`.
- Probe result (dry-run, after the edit): the scaffold still plans
  `.oxlintrc.json` and `vite.config.mts` — linter oxlint and bundler vite
  preserved. It still plans `CREATE .babelrc`: the library generator's own
  default ignores the application value, and `--babel=false` is accepted and
  then ignored (both probes still planned `.babelrc`).
  - Resolved as a recorded convention rather than further config surgery:
    post-scaffold, `.babelrc` is inert in this stack and deleted on arrival.
- Result: gate green after deletion — project set unchanged (4), graph parses,
  all six targets pass on a 0%-cache run, and `shared-ui:build-storybook` (the
  explicit babel/storybook probe) built clean with no `.babelrc` present.
  Builds, tests, typecheck, and Storybook are unaffected by babel's absence.
- Consequence: future `nx g` scaffolds must have their `.babelrc` deleted
  before commit; no babel config governs anything in this workspace. The root
  `@babel/core`/`@babel/preset-react` devDeps are removed in entry 2 below —
  showing the transitive-requirement boundary of `@vitejs/plugin-react` for
  anyone who looks later.

### Entry 2 — ten dead devDeps and the chromatic/verdaccio targets

- Date: 2026-10-03
- Dependencies removed (`bun remove`, lockfile re-saved): `ajv`, `verdaccio`,
  `typescript-eslint`, `@babel/core`, `@babel/preset-react`, `@vitest/ui`,
  `chromatic`, `jiti`, `ts-node`, `@nx/web`.
- Config mirrors removed:
  - `nx.json` `targetDefaults.chromatic` (the CLI invocation target).
  - The mis-nested `targets."targets"."chromatic"` block in
    `libs/shared/ui/project.json` (a target nested inside another target,
    dead since it was authored).
  - The root package.json `nx` `targets.local-registry` block (the verdaccio
    publish-rehearsal; `.verdaccio/` removed with it).
  - The `ts-node` compiler-options block in the root `tsconfig.json`.
- Naming-split worth recording: `chromatic` (CLI) and
  `@chromatic-com/storybook` (runtime addon, in `dependencies`, loaded by
  `.storybook/main.ts`, powering the story-level snapshot params) are
  different packages. Only the CLI and its local targets were dead; the
  addon stays, and CI's `chromaui/action` self-runtimes its own CLI, so
  workflow snapshots are untouched by this change.
- Verification: `nx reset` → project set unchanged (4); graph parses; greps
  show zero config references for all ten names outside the addon/workflow
  we deliberately kept; full gate green on a 0%-cache run — six targets,
  three build projects, both babel-dependent paths (Vite web build,
  Storybook build) passing with babel gone, and `@nx/web`'s optional-peer
  absence confirmed by `shared-ui:build-storybook`.
- Consequence: the verifier's local publish rehearsal (`local-registry`,
  verdaccio) no longer exists. Recording it here so nobody reads its absence
  as an oversight — the ui library stays publishable per ADR 0009; there is
  just no local rehearsal target for it anymore.
