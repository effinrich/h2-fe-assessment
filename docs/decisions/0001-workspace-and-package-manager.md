# 0001 — Nx workspace, npm, libraries over folders

- Status: accepted
- Date: 2026-10-01

## Context

Task 1 grades "package management, code formatting, and folder structure" — an
opinion, stated. Three package managers were on the table (npm, pnpm, bun) and
two task runners (Turborepo, Nx).

The overriding constraint is not speed. It is that **an unknown evaluator has to
run this**. Their first command is `npm install && npm start`. Anything that
requires pre-installed tooling is friction at exactly the wrong moment, and in
the worst case the code is fine and the submission still cannot be opened.

## Decision

**npm**, **Nx**, **libraries over folders**.

- npm: universally present, Nx's most-trodden path, and consistent with the
  reference monorepo this project is modelled on. pnpm is well supported but
  needs an install and brings `node-linker` config; bun is a runtime, and
  Nx+bun is the least-trodden of the three.
- Nx over Turborepo: the criterion is AI-forwardness. Nx exposes a queryable
  project graph (`nx show project`, `nx graph`), uniform per-project metadata,
  `scope:`/`type:` tags as an architecture map, boundary rules that fail lint
  before tests run, and generators. Turborepo is a task runner with no project
  model, so every structural question costs an agent file reads.
- Libraries over folders: 80% of code in `libs/`; `apps/web` is a shell.

## Consequences

- Install speed is worse than bun. Irrelevant at this size.
- Every project must be generator-created. A hand-made folder never enters the
  project graph, so `nx affected` skips it and tags never apply. A structure
  gate enforces this (see `HARNESS.md`).
- npm 12 blocks install scripts by default; the allowlist is committed in
  `package.json` rather than left in a machine-level config.
