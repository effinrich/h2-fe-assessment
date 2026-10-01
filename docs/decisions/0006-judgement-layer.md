# 0006 — Typed judgement for the gates a compiler cannot write

- Status: proposed — adopted only after the deterministic loop works
- Date: 2026-10-01

## Context

The gates are deterministic where facts are involved: types, lint, tests,
builds. Scope and quality are not facts, and today they are checked by an agent
reading a diff and returning prose — expensive, unversioned, and not
machine-checkable.

## Decision

Use **TypeSafe (jev)** for the judgement questions, asked as typed questions
against the diff and the spec in a single call:

| Question | Primitive | Use |
|---|---|---|
| Does this diff add public API not named in the spec? | `Noul` (0–1) | scope creep |
| Which spec criterion does this change address? | `Choice` | traceability |
| How completely does this satisfy the spec? | `Score` + rubric | completeness |

The gate blocks when a `Noul` exceeds a threshold or a `Score` falls short,
**weighted by the returned confidence**, so a low-confidence answer escalates
instead of guessing.

## Consequences

- One more integration, deliberately last: it is only worth adding where no
  compiler can answer.
- Confidence-weighted thresholds are the mechanism that keeps a probabilistic
  check from becoming a confident wrong gate.
