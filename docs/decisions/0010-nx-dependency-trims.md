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
   Baseline (verified 2026-10-04): `@h2-fe/web`, `@h2-fe/home`,
   `@h2-fe/pdf-viewer`, `@h2-fe/web-ui`, `shared-ui`, `@h2-fe/source`
   (`@h2-fe/importers` was deleted — see Entry 4).
3. `bunx nx graph --file=...` still parses.
4. Targeted greps across `nx.json`, all project/package jsons, vite configs,
   and workflows.
5. Full `bun run gate` (lint, format, typecheck, test, build, build-storybook);
   the gate's `shared-ui:build-storybook` run doubles as the explicit
   babel/storybook probe.
6. For `generators."@nx/react"` edits: `bunx nx g @nx/react:lib tmp-probe --dry-run`
   (names with leading underscores are invalid; dry-run makes no changes) — the
   plan must still show `.oxlintrc.json` and `vite.config.mts`.

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

### Entry 3 — the build-storybook targetDefault drops webpackStatsJson

- Date: 2026-10-03
- Change: removed `options.webpackStatsJson: true` from the `nx.json`
  `build-storybook` targetDefault; the option stays on `shared-ui`'s explicit
  `@nx/storybook:build` target.
- Evidence: `libs/web/ui`'s storybook targets come from the @nx/storybook
  plugin's inference (run-commands of the storybook CLI). The targetDefault's
  option was forwarded to the CLI as `--webpackStatsJson=true`, which
  `storybook build` rejects ("error: unknown option"). The executor-driven
  target knew the flag; the CLI-inferred one did not.
- Verification: full 0%-cache gate green including both storybook builds —
  `shared-ui` (executor, stats kept) and `@h2-fe/web-ui` (inferred, no flag).
  `nx reset` + project set unchanged; graph parses.
- Consequence: the workspace-wide chromatic-stats knob is gone; per-project
  storybook targets configure it where it means something.

### Entry 4 — two route-scoped feature libs and the web stage are scaffolds

- Date: 2026-10-03
- Change: `nx g @nx/react:library` scaffolded `@h2-fe/pdf-viewer`
  (`libs/web/features/pdf-viewer`) and `@h2-fe/home`
  (`libs/web/features/home`), then `@h2-fe/web-ui` (`libs/web/ui`, tags
  `["scope:web","type:ui"]`) with its own Storybook stage. Feature libs carry
  `tags ["scope:web","type:feature"]`. The `importers` project was deleted
  outright; every live symbol of it moved into one of the new libs and the
  rest was already dead.
- Scaffold hazards handled, per entry 1's convention:
  - The generator re-added its babel set as devDeps; they were re-removed
    (`@babel/core`, `@babel/preset-react`, `@nx/web`, `@swc/helpers`, `ajv`,
    `@vitest/ui`, `jiti`, `ts-node`, `typescript-eslint`).
  - The generator names a lib from the directory arg's last segment:
    `libs/web/ui` produced `@h2-fe/ui` and collided with shared-ui; renamed
    to `@h2-fe/web-ui` before the workspace settled.
  - Both emitted `.babelrc`s deleted post-scaffold.
  - Both new `vite.config.mts` test configs point `setupFiles` at
    `tools/vitest-setup.ts` (as the app and the old importer did) and carry
    the `@h2-fe/source` resolve condition so the app consumes their TS
    source directly.
- Verification: `nx reset` → project set changed exactly as designed (six
  projects now: `@h2-fe/web`, `@h2-fe/home`, `@h2-fe/pdf-viewer`,
  `@h2-fe/web-ui`, `shared-ui`, `@h2-fe/source`); `nx sync` rewrote project
  references (the app's tsconfigs + the libs'); graph parses; full gate green.
- Consequence: the audit's "importers feature" is gone from the graph; the
  intended tier set is in its place.

### Entry 5 — remove reverse web UI dependencies

- Date: 2026-10-03
- Change: remove `@h2-fe/web-ui`'s implicit dependencies on `home` and
  `pdf-viewer`. Its `build-storybook` inputs already include feature stories.
- Cause: `pdf-viewer` imports `web-ui`; the reverse implicit edge creates a
  circular project dependency and makes boundary lint fail.
- Verification: graph shows `pdf-viewer → web-ui → shared-ui` with no reverse
  feature edges; all-project lint, format, typecheck, and tests pass. Full gate
  must also pass before merging this branch.

### Entry 6 — align formatter target names

- Date: 2026-10-03
- Change: rename the `oxfmt` and `oxfmt:fix` Nx targets to `format` and
  `format:fix` in target defaults, project declarations, root scripts, and the
  affected gate. The executable remains oxfmt; `lint` remains oxlint.
- Verification: `nx show project` resolves both format targets across the
  projects; run the full gate with the new target before merging.
