# 0005 — Spec-driven and test-driven, enforced rather than aspired to

- Status: accepted
- Date: 2026-10-01

## Context

The brief grades process explicitly: "we want to see your decisions, thoughts,
and overall how you would communicate and collaborate". It also warns against
losing yourself in the AI process.

Discipline that lives in good intentions evaporates under time pressure. It has
to be mechanical.

## Decision

**Specs bound the work; tests bound the code; hooks bound both.**

- **SDD.** Every task starts as `docs/specs/<task>.md` with acceptance criteria
  in falsifiable form, written before code. `scope-guard` checks the diff against
  it. A criterion cannot be marked done without a test that fails without the
  change.
- **TDD.** Red → green → refactor per criterion. The failing test is *evidence*,
  not ceremony: it appears in the commit so the record shows the test came first
  rather than being back-filled.
- **Enforcement.** A `Stop` hook runs the gates at end of turn and blocks the
  turn with the failures, so nothing is ever finished broken.

## Consequences

- More ceremony than shipping straight to code. The ceiling on that cost is
  bounded: specs are acceptance criteria, not essays; TDD applies to logic and
  interaction, with chromatic snapshots covering static styling.
- Documents written before code read differently from documents written after,
  which is the point.
