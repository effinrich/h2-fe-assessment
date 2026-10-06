# Agent instructions

Canonical. Cursor and Windsurf read this file natively; `CLAUDE.md` carries the
Nx-generated block only.

## Scope rules (read before writing code)

1. **Use the vendor's solution.** Before building anything, check
   [tldraw's examples](https://tldraw.dev/examples) and the installed library.
   Start from the example; change only what the brief needs.
2. **Stay inside the brief.** Anything beyond it is a question for the user,
   not a default.
3. **Smallest working diff.** No specs, stories or tests unless asked. The
   design system has stories; features and routes do not.
4. **Verify every third-party API against the installed types** before it
   lands, tldraw especially.
5. **Never guess a CLI flag.** Check `--help` or `nx_docs`.
6. **Ask before deleting any config file.**

## Workspace

- Nx 23 + bun: `bun` / `bunx nx`, never npm or npx. `nx` and every `@nx/*`
  stay on one exact version.
- Every dependency goes in the root `package.json`. Its
  `"nx": { "includedScripts": [] }` is load-bearing: without it the root
  scripts become targets on `@h2-fe/source` and `run-many` calls itself.
- New projects come from generators, with `scope:*` and `type:*` tags;
  `@nx/enforce-module-boundaries` in `.oxlintrc.json` enforces them.
- `lint` is oxlint (`--type-aware`), `format` is oxfmt. No ESLint. Projects
  extend the root `.oxlintrc.json`; never add a nested `.oxfmtrc.json`.
- `bun run gate` = the size budget (`tools/size-budget.mjs`: source files and
  non-blank lines in `apps/` and `libs/`) then
  `nx affected -t lint,format,typecheck,build,build-storybook`. Over budget
  means cut scope; raising a limit is the user's call.
  lefthook: pre-commit lints, formats and typechecks staged files; pre-push runs
  the gate. CI runs the gate too. Don't leave `LEFTHOOK=0` on.
- Actions are pinned to full commit SHAs. LF line endings.

## Layout

- `apps/web`: the routes (home `/`, viewer). The viewer route composes the features.
- `libs/shared/ui` (`@h2-fe/ui`): the design system. Chakra primitives
  re-exported, a few wrapped components, each with a story. The only Storybook;
  Chromatic publishes it.
- `libs/web/features/{pdf-viewer,pin,camera}`: must not import each other.
  pdf-viewer also owns the app chrome (`AppHeader`, exported for home, and
  `ViewerTopBar`).

Stack: Vite, React 19, TypeScript strict, Chakra UI v3, TanStack Query,
tldraw v5, Storybook 10 + Chromatic.

## tldraw facts

- Locked shapes: `updateShapes` / `deleteShapes` silently no-op unless run in
  `editor.run(..., { ignoreShapeLock: true })`.
- Never change `src` on an image asset a shape is showing; create a new asset
  id and repoint the shape.
- `ShapeUtil.indicator` is deprecated; use `getIndicatorPath`. Use
  `getCurrentPagePoint()`, not `inputs.currentPagePoint`.
- Chakra styles app chrome; tldraw CSS variables and overrides style canvas UI.
  Sync colour mode with `editor.setColorMode`; never remount `Tldraw`.

## Working here

- Use Chakra the attribute/recipe way, not utility soup. Don't wrap tldraw
  internals in `chakra()`.
- Commit and push in small PRs without waiting to be asked. Check the branch
  before committing and commit by explicit pathspec; other sessions may share
  the checkout, so do parallel work in a git worktree.
- Don't stage local junk (`.gitignore` edits, `.github/agents/`, logs, zips).
- An honest "I don't know" is fine; then go and verify.
