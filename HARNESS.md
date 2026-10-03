# The harness

What makes this repo work with agents repeatably, rather than once.

## The rule that decides everything

**If it exists only in a conversation, it is not in the harness.** A reviewer who
cannot open it cannot judge it — and the brief states it grades communication and
process, not just output.

## Loop

```
spec → failing test → build → gates (hook) → verifier → scope-guard → ux-critic → commit
```

1. **Spec** — `docs/specs/<task>.md`, acceptance criteria first.
2. **Failing test** — one per criterion, committed red.
3. **Build** — `builder`, from the spec.
4. **Gates** — a `Stop` hook runs them at end of turn and blocks the turn with
   the failures.
5. **`verifier`** — every third-party call checked against installed types.
6. **`scope-guard`** — the diff against the spec: what is extra, what is unmet.
7. **`ux-critic`** — our UI against `docs/demos.md`.
8. **Commit** — constraints → agents → work, in that order historically.

## Agents

| Agent         | Asks                          |
| ------------- | ----------------------------- |
| `builder`     | one scoped unit, test-first   |
| `verifier`    | is every API real?            |
| `scope-guard` | is this in scope?             |
| `ux-critic`   | is this better than the demo? |

Each asks a **different** question. Two agents running one checklist is one
answer twice at double cost. Model diversity only pays when the checks differ.

## Gates

```
bun run gate   →   nx affected -t lint,oxfmt,typecheck,test,build,build-storybook
```

Wired to a `Stop` hook (`.commandcode/settings.json`), so failures reach the
model before the turn ends. Affected-only: an agent that re-runs the world every
turn burns the feedback loop it depends on.

**Structure gate.** Every path under `apps/` and `libs/` must appear in
`nx show projects`, and every project must carry both a `scope:` and a `type:`
tag. This converts "the agent ignored the Nx rules" from a review comment into a
failing check whose message the model can act on.

## Exclusions, on purpose

- **three.js** — considered and declined. ADR 0003.
- **Tailwind, Radix, shadcn** — considered and declined. ADR 0004.
- **SSR and a router** — one route, client-only canvas. ADR 0002.
- **Backend, auth, persistence** beyond tldraw's local store. ADR 0009.
- **Screens storied exhaustively** — only in meaningful states. ADR 0007.
- **Testing inside the architecture skill** — the skill governs structure; the
  suite is the gate. ADR 0005.

## Known issue — resolved

This used to record that `@nx/oxlint` (22.x-less) pulled `nx@23.2.1` alongside
the workspace's `nx@22.7.12` — two nx copies in one tree, undecided. The
workspace moved up to 23 in the bun migration (`nx@23.2.1`, single install),
so the two-nx tree no longer exists, and module boundaries now run inside
oxlint — the alignment outcome of the original choice. ADR 0008's addendum
records the whole story.
