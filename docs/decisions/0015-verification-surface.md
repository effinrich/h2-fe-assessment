# 0015 — The verification surface: the gate, the tests, the stories, the snapshots

- Status: accepted
- Date: 2026-10-26

## Context

The test harness went with PR #43, and the jsdom suite went with it: the
feature specs, the route specs, the app spec, and the stories for the features
and the screens. What was left is the gate, the stories in the design system,
and Chromatic's snapshot check.

This record answers the question the removal left open: what covers behaviour
now, and what does not.

## Decision

**One verification surface, four parts.**

- **The gate** — lint, format, typecheck, build, build-storybook, the unit
  tests, and the guardrail check. It derives what to run from the project
  graph with `nx affected`, so it covers what changed rather than what
  somebody remembered to list.
- **The unit tests** — `bun test` over the logic that has no DOM in it: the
  pin solver, the page geometry, the canvas-extension merge, the PDF
  page-match rule and the crop brackets. Added on 2026-11-03; see 0019.
- **The stories** — the design system's stories are the component tests. Six
  play functions across five stories exercise the interaction: button, colour
  mode, modal, form, toaster. A play function is a test that also renders.
- **The snapshots** — Chromatic compares every story against the accepted
  baselines, so a visual change is a visible diff rather than a surprise, and
  `UI Review` shows the comparison per story.

The Storybook interaction tests and the snapshot tests cover the same ground a
separate interaction suite would cover, so there is no second interaction
suite to keep in step with the first.

**A check has to fail for the right reason before it is trusted.** The spec
loop said it as a test that fails because it cannot import the module has
proven nothing. It generalises to every check in this repository: a gate that
fails because a tool is missing has proven nothing, and neither has a check
that passes for the wrong reason.

Three checks that passed for the wrong reason were written and fixed while this
record was being made — a forbidden-path rule that only matched at the
repository root, a tag check that skipped a project with no tags, and a tag
check that skipped a project file it could not parse. The rule is not inherited
from the old harness; it is what caught them, and it caught the third one only
because the second merge made it worth looking for.

## Consequences

- Interaction coverage lives next to the component, in the story. Visual
  coverage lives in Chromatic, against a baseline someone accepted.
- **The features and the screens have no automated interaction coverage, and
  the brief does not ask for any.** The specs that covered them were the first
  agent's priority rather than the brief's, and they went with the harness in
  #43. What stands in for them is the type system, the boundary rules, and
  the walkthrough, which a reviewer can watch. Nothing here falls short of
  the brief — it is the same recorded exclusion as ADR 0009's, written down
  so the next reader finds the decision instead of the hole.
- A new interaction in a feature is verified by a story or by hand. That is
  the trade the exclusion makes: less to maintain, and a reviewer's eye on
  the walkthrough instead of a suite.
- Nothing in this decision is allowed to be deleted quietly. The gate's
  targets, the boundary rule and the decision records are all in
  `tools/guardrails.manifest.json`, so removing one fails the build.

## Amendment (2026-11-03): the fourth part

The unit test loop was added on the owner's instruction rather than the
brief's, and this record's "no separate unit-test suite" was amended rather
than left standing next to a suite that contradicts it. ADR 0019 is the record
of what the suite covers and what it does not.

The direction of the guardrail changed with it. `test` was forbidden in the
gate, so a suite could not be added without the owner changing that file; it
is now required, so a suite that is dropped makes the build fail rather than
the gate go quietly green. The rest of this record is unchanged: the features
and the screens still have no automated interaction coverage, and that is
still a recorded exclusion rather than a hole.
