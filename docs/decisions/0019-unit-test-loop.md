# 0019 — A unit test loop

- Status: accepted
- Date: 2026-11-03

## Context

The brief did not ask for a test suite. The first agent's harness was removed
in #43 for that reason, ADR 0009 recorded the exclusion, and ADR 0015 recorded
what covers behaviour in its place.

The exclusion was enforced, not just written down. `tools/guardrails.manifest.json`
forbade the gate from running a `test` target, so a suite could not be added
without the owner changing that file. The build said the same thing as the
records: no tests here, and the reason is the brief.

The owner has now asked for one anyway. The judgement was about the brief, and
a judgement is not a law: it was the owner's to make and it is the owner's to
change. He has changed it. This record says so rather than pretending the
brief asked for it after the fact.

## Decision

**A unit test loop over the pure logic, run by the gate.**

- **The runner is `bun test`.** Bun is already the package manager and the
  runtime in this repository, and its test runner is built in, so nothing new
  is installed to run a test.
- **What is under test is what has no DOM in it.** `tldraw` and `pdf-lib` both
  import cleanly outside a browser, which puts the pin solver, the page
  geometry, the canvas-extension merge and the PDF page-match rule within
  reach. What needs an editor, a canvas or a React tree does not: the shape
  utilities, the tools, the components and the browser-only paths stay where
  ADR 0015 put them, with the stories, the snapshots and the walkthrough.
- **The gate runs it.** `bun run gate` gains `test` in the `nx affected` target
  list, and each feature that has tests gets a `test` target running `bun
test` in the project root. A change to a feature runs that feature's tests.
- **The guardrail flips direction.** `test` moves out of
  `gateTargets.forbidden` and into a new `gateTargets.required`, so the build
  now fails if the gate stops running the tests. That is the point of the
  change: the old rule kept a suite out, and the new one keeps a suite in.
- **The size budget counts product source and test source separately.** The
  product ceiling stays at 95 files and 3300 non-blank lines, and the product's
  own count barely moves: it goes from 79 files and 3063 lines to 81 files and
  3073, the two extra files being the solver and the pdfjs loader, each moved
  out of the file it used to live in. Test files are excluded from that count,
  because otherwise the first test would have to cost a line of product code.
  The suite gets its own budget — 12 files and 400 lines — so the exclusion is
  a bound rather than a hole. It is at 4 files and 227 lines.

## What it covers

The suite covers the four places where this code has decisions in it rather
than plumbing:

- **the pin solver** — the relaxation that resolves a whole network of pins and
  shapes, and the shapes that are fixed and must not move
- **the page geometry** — which page a viewport is over, and where a page sits
- **the canvas-extension merge** — the point where the feature set is composed
- **the PDF page-match rule** — the fallback from the source PDF's page to the
  canvas's rendering, which is the rule ADR 0018 was written against

## What it does not cover

The editor, the canvas, the React tree and the browser-only paths. Those need
a DOM, and a DOM means a test runner this repository does not have and #43
removed. That is the honest edge of this decision, and it is the edge ADR 0015
drew one level down.

## Consequences

- The suite is small on purpose. A suite that starts covering the editor is a
  suite that needs a DOM, and a DOM brings back the dependency and the
  configuration that came off this list in #43.
- The tests are typechecked by the same gate as the product, so a test that
  cannot compile is a red gate rather than a test that quietly does nothing.
- ADR 0009's testing bullet and ADR 0015's "no separate unit-test suite" were
  true when they were written and are amended here rather than left standing
  next to a suite that contradicts them.
