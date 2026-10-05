SUPERGOAL_PHASE_START
Phase: 6 of 6 — Polish & Harden
Task: A11y, pin first-use hint, honest handoff, gate, screenshots
Type: brownfield, ui
Mandatory commands: bun run gate
Acceptance criteria: 9
Evidence required: one paragraph per sub-pass, git diff --stat, gate last-15 + exit, screenshot paths
Depends on phases: 1, 2, 3, 4, 5

## Why

Catch what earlier phases missed because they were focused on leftover spec boxes. This is how “every aspect is perfect” gets enforced.

## Work

- **UX & copy:** grep added lines since baseline for TODO/FIXME, `console.log`, and visible `tool.crop-frame`. Fix or revert.
- **Pin first-use hint:** camera already has `first-use-hint.tsx`. Add the pin equivalent in the pin lib (do not import camera). Persist dismissal the same way camera does if a pattern exists; otherwise session-only is fine — document the ceiling with a `ponytail:` comment if you skip persistence.
- **Task 2 narrow-width a11y:** filename + page controls + loading/error reachable by keyboard at ≤390px. Tick `docs/specs/task-2-pdf.md` only if a story or browser pass proves it.
- **Toaster:** if a few lines in `@h2-fe/ui` can place the toast so it clears tldraw’s bottom toolbar at a narrow width, do that. No new toast library.
- **handoff.md:** rewrite to current HEAD. Tasks 3/4 shipped. Leftovers match this roadmap. Do not leave stub language.
- **Screenshots:** home + viewer (pin visible, crop-frame visible) in light, dark, and ~390px. Save under `.supergoal/finish-remaining-hiring-brief-product-wo-5Z2dui/qa/`.
- **Diff hygiene:** do not stage `docs/*.zip`, `.github/agents/`, `.vscode/settings.json`, `.supergoal/`.
- **Regression:** `bun run gate` (affected lint, format, typecheck, test, build, build-storybook, test-storybook).

## Acceptance criteria (all must pass — verify each in transcript)

- **UX & copy** — no “TODO”, “lorem”, or `tool.crop-frame` visible strings in feature `src` (grep added lines).
- **States** — empty / loading / error still present on home + viewer (existing stories still pass as part of gate).
- **Edges** — crop export still disabled on empty frame; pin still refuses PDF pages (`canAttach`).
- **Security** — no new secrets; PDF still client-side only.
- **A11y** — filename + page controls reachable by keyboard at ≤390px width (story or browser pass); camera toolbar still 44px.
- **Perf** — no new unbounded scan added; no new `console.log` in app `src`.
- **Diff review** — `git diff --stat` contains no `docs/*.zip`, `.github/agents/`, `.vscode/settings.json`.
- **Regression sweep** — `bun run gate` exits 0.
- `handoff.md` mentions pin + camera and does not claim they are stubs.

## Mandatory commands (run each, surface last ~10 lines + exit code)

- `bun run gate`

## Evidence required in transcript

- One paragraph per sub-pass (UX, states, edges, security, a11y, perf, diff, regression)
- Final `git diff --stat`
- Gate last ~15 lines + exit code
- Screenshot paths (light, dark, narrow)

## Notes

Do not start scheduled Task 2 performance extras. Do not add web-ui Chromatic tokens (ADR 0011 deferred). Do not record a walkthrough video.

If Phase 4 was skipped, still screenshot current indigo — say so — and do not retoken here unless a contrast bug fails AA.

---

The agent will, during execution, print SUPERGOAL_PHASE_START (above),
do the work, then print SUPERGOAL_PHASE_VERIFY, MEMORY_SAVED, and
SUPERGOAL_PHASE_DONE in order. On failure, the agent follows the
3-strike recovery protocol in .supergoal/finish-remaining-hiring-brief-product-wo-5Z2dui/PROTOCOL.md without further
instruction needed here.
