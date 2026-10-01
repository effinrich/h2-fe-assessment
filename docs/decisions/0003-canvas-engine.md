# 0003 — tldraw, not three.js

- Status: accepted
- Date: 2026-10-01

## Context

tldraw is named four times in the brief, and Task 3 asks specifically for "deep
integration with the Editor API from tldraw". The team behind the exercise has
since moved to three.js, which makes three.js tempting.

## Decision

**tldraw.**

Deviating from an explicit instruction is the cheapest available way to lose
points, and the demos we are asked to beat are tldraw demos. The engineering
being demonstrated — custom `ShapeUtil` subclasses, bindings between shapes,
app-owned DOM, export pipelines — is what transfers; a three.js rewrite would
demonstrate *different* work, not better work.

## Consequences

- We depend on a library the team no longer uses. Recorded here so the choice
  reads as judgement rather than ignorance.
- Every tldraw API call is verified against the installed types before it lands
  (see the `verifier` agent), because model familiarity with tldraw is weaker
  than with React.
