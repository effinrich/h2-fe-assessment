SUPERGOAL_PHASE_START
Phase: 5 of 6 — Write reviewer README
Task: Replace the Nx starter README with a 5-minute reviewer walkthrough
Type: brownfield
Mandatory commands: bunx nx run @h2-fe/web:typecheck
Acceptance criteria: 6
Evidence required: wc -l README.md, quoted headings, typecheck exit code
Depends on phases: 1

## Why

The brief grades teamwork. Root `README.md` is still the Nx starter; a reviewer cannot learn install, routes, or refusals from it.

## Work

- Rewrite `README.md` (keep it under 200 lines).
- Must include: `bun install`; how to serve (`bun run start` or `bunx nx serve @h2-fe/web`); `/` and `/viewer`; what we did better than the demo videos (persistent crop, pin attach, loading/error); what we refused with a pointer to `docs/decisions/0009-not-built.md`.
- Must not claim scheduled Task 2 performance extras are shipped.
- Do not dump the full ADR list; link `docs/decisions/` and `docs/specs/`.
- Do not invent setup steps. Verify commands against `package.json` scripts.

## Acceptance criteria (all must pass — verify each in transcript)

- `README.md` contains `bun install` and `bunx nx serve @h2-fe/web` (or `bun run start`).
- `README.md` names `/` and `/viewer`.
- `README.md` states what we did better than the demo videos (persistent crop, pin attach, loading/error).
- `README.md` states what we refused (no backend, no whole-PDF export, no persistence across refresh) and points at `docs/decisions/0009-not-built.md`.
- `README.md` does not claim scheduled Task 2 performance extras are shipped.
- `README.md` is under 200 lines.

## Mandatory commands (run each, surface last ~10 lines + exit code)

- `bunx nx run @h2-fe/web:typecheck`

## Evidence required in transcript

- `wc -l README.md` (or PowerShell equivalent line count)
- Quoted headings from the new README
- Exit code of typecheck

## Notes

Do not rewrite `AGENTS.md` or `handoff.md` here (`handoff.md` is Phase 6). Do not add a second CONTRIBUTING.md.

---

The agent will, during execution, print SUPERGOAL_PHASE_START (above),
do the work, then print SUPERGOAL_PHASE_VERIFY, MEMORY_SAVED, and
SUPERGOAL_PHASE_DONE in order. On failure, the agent follows the
3-strike recovery protocol in .supergoal/finish-remaining-hiring-brief-product-wo-5Z2dui/PROTOCOL.md without further
instruction needed here.
