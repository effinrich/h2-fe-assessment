# Agent instructions

Canonical. Cursor and Windsurf read this file natively; no mirrors. `CLAUDE.md`
carries the Nx-generated block only.

## Nx: never infer, always ask the graph

**A config file is not evidence.** Nx infers targets and tags from plugins and
`package.json`, so a sparse `project.json` says nothing about what a project can
do. Reading `"targets": {}` and concluding "no build target" is a real mistake
made during this project's setup.

- Ask, don't read: `nx show project <name>` (targets, tags, metadata),
  `nx show projects`, `nx graph` (dependencies).
- Before asserting any Nx behaviour — a flag, a default, whether something is
  inferred — check `nx_docs` or `--help`. Do not reason from how other tools work.
- The installed `nx-workspace-patterns` skill covers workspace queries.

## Workspace

- **Nx 23 + bun.** Prefer `bunx nx` over a global CLI. `nx` and every `@nx/*`
  stay on one exact version; mixing majors crashes every plugin
  (`The "path" argument must be of type string`).
- **Install at the root.** Every dependency goes in the root `package.json`
  (`bun install` from the repo root, no `-w`). Workspace `package.json` files
  list no dependencies and no proxy scripts. The root `package.json`'s only
  `nx` key is `"includedScripts": []`, and it is load-bearing: without it the
  root scripts (`lint` = `nx run-many -t lint`) become targets on
  `@h2-fe/source` and `run-many` calls itself.
- **No manual linking.** Nx infers project edges from imports and bun workspaces
  resolve `@h2-fe/*`; don't add workspace packages to an app's `package.json`.
  Tags restrict imports; they don't link.
- **Generators only.** Never hand-create a project folder. A hand-made folder
  never enters the project graph, so `nx affected` skips it and tags never apply.
  `nx g @nx/react:lib <name> --directory=libs/<scope>/<name> --tags=scope:<scope>,type:<type>`
- **Tags are mandatory** on every project, and `@nx/enforce-module-boundaries`
  in the root `.oxlintrc.json` enforces them. An illegal import fails lint
  before tests run.
- `nx affected` over `--all` on any branch. `bun run gate` =
  `nx affected -t lint,format,typecheck,test,build,build-storybook,test-storybook`.
- **`test-storybook`** runs every story (render, play function, axe a11y at
  `"error"`) in headless Chromium via `@storybook/addon-vitest`, with v8
  coverage to `coverage/<projectRoot>`. Each Storybook project has a
  `vitest.storybook.config.mts`: the name sits outside the inferred-`test`
  glob, so `test` stays the jsdom run. The target lives in nx.json
  `targetDefaults`; a project opts in with `"test-storybook": {}`. Feature
  stories run in the `@h2-fe/web-ui` stage and are also globbed into
  `shared-ui` so Chromatic's one publish includes them. Locally, run
  `bunx playwright install chromium` once.
- **Feature stories and `affected`.** web-ui and shared-ui do not import the
  features (and `implicitDependencies` would cycle), so their `test-storybook`
  / `build-storybook` inputs list the feature and home-route story files.
  Nx treats `{workspaceRoot}` inputs as implicit dependencies: a feature-only
  change marks those Storybook targets affected and busts both caches. Keep
  those inputs. A stories glob is not a source import: `libs/shared/ui` must
  still not import `scope:web`.
- **`@h2-fe/source`** is the repo root. `nx show project @h2-fe/source` reports
  no targets. Root `package.json` `"includedScripts": []` is why.
- **oxlint only, no ESLint.** `@nx/oxlint` has no executors: `lint` is its
  inferred target (`args: ["--type-aware"]` in `project.json`); never write
  `@nx/oxlint:lint`. Two plugins must not claim the same target name.
- **Target names are `lint` and `format`.** `oxlint` and `oxfmt` are only the
  binaries behind those targets — never target names. `format` / `format:fix`
  live only in nx.json `targetDefaults` (`@nx/oxlint` has no oxfmt support);
  root scripts mirror `lint` / `lint:fix`.
- **Nested ox configs.** Projects carry their own `.oxlintrc.json` (`extends`
  the root) but no `.oxfmtrc.json`: oxfmt has no `extends`, so a nested one
  replaces the root config wholesale; without one, oxfmt walks up to the root.
  Never set `oxc.configPath` / `oxc.fmt.configPath`: they disable nested
  configs, so the editor diverges from the gate.
- **Editor config is cross-platform** (teammates on macOS): no absolute or
  OS-specific binary paths in `.vscode/`. Official `oxc.oxc-vscode` only; it
  resolves `oxlint` / `oxfmt` from `node_modules/.bin` itself.
- **Git hooks: lefthook** (`lefthook.yml`), installed by its own postinstall
  on `bun install` (bun trusts it by default; skipped when `CI` is set).
  pre-commit: `oxlint --type-aware --fix` then `oxfmt` on staged files
  (re-staged), plus `nx affected -t typecheck --uncommitted`. pre-push:
  `bun run gate`. CI still runs the gate, so hooks are a fast path, not the
  check. `LEFTHOOK=0` bypasses them.
- LF line endings (`.gitattributes`). Every Action in every workflow is pinned
  to a full commit SHA with a `# vX.Y.Z` comment. `ci.yml` runs `bun run gate`
  after `nrwl/nx-set-shas`.

## Stack

Vite + React 19 + TypeScript (strict) · Chakra UI v3 · TanStack Query · tldraw v5 ·
Storybook 10 (play tests via `storybook/test`) + Chromatic · Vitest

## Layout

- `libs/shared/ui` — the design system. Every `type:ui` component has a story;
  its play tests are the component tests (no Vitest unit tests here). Public API
  is the `src/index.ts` barrel, consumed as named imports from `@h2-fe/ui`. Simple Chakra primitives are re-exported unchanged
  (`src/lib/primitives/`); compound components get thin wrappers, one folder each.
- `libs/<scope>/features/<name>` — feature libs; inside them, the
  feature-based-architecture skill governs the file layout.
- `apps/web` — route hosts. A page may compose many features. Home is the
  `/` route here (`src/app/routes/home`), not a feature lib. Other logic
  belongs in libs.

## Rules that do not bend

1. **Verify every third-party API call against the installed types** before it
   lands. tldraw is under-represented in training data relative to React, and
   this is where models invent plausible method names.
2. **Spec before code; failing test before implementation.** See
   `docs/specs/README.md`.
3. **The gate hook is authoritative.** A red gate is not a finishable turn.
4. **Never guess a CLI flag.** Check `--help` first.
5. **Be terse.** The user is a long-time Nx user; don't over-explain. Re-read a
   file before editing it — never overwrite the user's concurrent edits.
6. **Ask before deleting any config file**, even when deletion looks like the
   obvious fix (nested rc files, dead config, `git rm --cached`).

## Learned User Preferences

- Quality over speed: do not rush; stay calm; best work over finishing fast.
- Do not harp on the oxc/editor lint-fix extension or chase flaky editor
  diagnostics; the gate is authoritative.
- Use Chakra the attribute/recipe way, not Tailwind-like utility soup.
  Wrap our chrome with `chakra()` onto app tokens; do not wrap tldraw
  internals in `chakra()`.
- bun only — never `npm install` or `npx` for workspace deps or Nx
  (`bun` / `bunx nx`).
- Commit and push regularly on your own (do not wait for the user to ask), with smaller PRs so progress is easier to track. Do not leave `LEFTHOOK=0` on.
- Do not stage local-only junk: the user's `.gitignore` edits,
  `.github/agents/`, `firebase-debug.log`, `docs/*.zip`.
- An honest "I don't know" is accepted and encouraged when something was not verified.

## Learned Workspace Facts

- A feature is a capability you can name and ship; a route is a host and may
  compose many features. Home is the `/` route in `apps/web`
  (`apps/web/src/app/routes/home`), not a feature project (`@h2-fe/home` was
  removed). Pin, camera, and pdf-viewer stay sibling feature libs and must not
  import each other; only `apps/web` (the viewer route) composes canvas
  extensions (ADR 0011).
- The reviewer walkthrough is `docs/reviewer.md` (linked from the README).
- Locked tldraw shapes: `updateShapes` / `deleteShapes` silently no-op unless
  `editor.run(..., { ignoreShapeLock: true })`.
- Never update `src` in-place on a tldraw image asset a shape is already
  showing (32-frame debounce); create a new asset id and repoint the shape
  (ADR 0012).
- `ShapeUtil.indicator` is deprecated and not rendered; use
  `getCurrentPagePoint()` instead of `inputs.currentPagePoint`.
- tldraw and Chakra are two styling systems (ADR 0013): Chakra for app
  chrome; tldraw CSS variables and component overrides for canvas UI;
  tldraw StyleProps only for persisted shape data. Bridge tokens with
  scoped CSS vars after `tldraw.css`. Sync color mode with
  `editor.setColorMode` after mount — do not remount `Tldraw`.
