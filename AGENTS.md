# Agent instructions

Canonical. Mirrors live in `.cursor/rules/` and `.windsurf/rules/`; when you edit
a rule here, edit those in the same change. `CLAUDE.md` carries the Nx-generated
block only.

## Nx: never infer, always ask the graph

**A config file is not evidence.** Nx 22 infers targets and tags from plugins and
`package.json`, so a sparse `project.json` says nothing about what a project can
do. Reading `"targets": {}` and concluding "no build target" is a real mistake
made during this project's setup.

- Ask, don't read: `nx show project <name>` (targets, tags, metadata),
  `nx show projects`, `nx graph` (dependencies).
- Before asserting any Nx behaviour — a flag, a default, whether something is
  inferred — check `nx_docs` or `--help`. Do not reason from how other tools work.
- The installed `nx-workspace-patterns` skill covers workspace queries.

## Workspace

- **Nx 22 + npm.** Prefer `pnpm nx`/`npx nx` over a global CLI.
- **Generators only.** Never hand-create a project folder. A hand-made folder
  never enters the project graph, so `nx affected` skips it and tags never apply.
  `nx g @nx/react:lib <name> --directory=libs/<scope>/<name> --tags=scope:<scope>,type:<type>`
- **Tags are mandatory** on every project, and `@nx/enforce-module-boundaries`
  enforces them. An illegal import fails lint before tests run.
- `nx affected` over `--all` on any branch.

## Stack

Vite + React 19 + TypeScript (strict) · TanStack Query · tldraw v5 ·
Panda CSS + Ark UI via Park UI · Storybook + Chromatic · Vitest

## Layout

- `libs/shared/ui` — the design system. Every `type:ui` component has a story.
- `libs/<scope>/features/<name>` — feature libs; inside them, the
  feature-based-architecture skill governs the file layout.
- `apps/web` — a thin shell. Logic belongs in libs.

## Rules that do not bend

1. **Verify every third-party API call against the installed types** before it
   lands. tldraw, Ark and Park UI are all under-represented in training data
   relative to React, and this is where models invent plausible method names.
2. **Spec before code; failing test before implementation.** See
   `docs/specs/README.md`.
3. **The gate hook is authoritative.** A red gate is not a finishable turn.
4. **Never guess a CLI flag.** Check `--help` first.
5. **Generated files stay generated.** `styled-system` is rebuildable from
   `npm run prepare`; never edit it.
