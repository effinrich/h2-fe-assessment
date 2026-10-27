# 0009 — What we deliberately did not build

- Status: accepted
- Date: 2026-10-01

## Context

An unexplained absence reads as an oversight. A recorded exclusion reads as
judgement. This is the cheapest credibility in the submission.

## Decision — out of scope, on purpose

- **No backend, auth, or persistence** beyond tldraw's local store. The four
  tasks are a canvas app; adding a server would be scope the brief did not ask
  for.
- **No SSR.** Still true. (The router is no longer excluded — two routes are
  live; see 0002's amendment and ADR 0011.)
- **three.js.** Considered and declined; see 0003.
- **Tailwind, Radix, shadcn.** Considered and declined; see 0004 and 0014.
- **Build-time CSS (Panda + Ark).** Chakra generates CSS at runtime. Panda
  would compile it; Chakra's tokens and recipes already follow Panda's model,
  so the move stays open. See 0014.
- **Publishing the UI library.** It is a real workspace package with enforced
  boundaries, and it stays publishable — but publishable is not published, and
  no release process is implied.
- **Testing inside the architecture skill.** The skill governs structure; the
  test suite is the gate. Both exist, in different places, on purpose.

## Consequences

- The submission is smaller than it could be, and says why at each omission.

## Amendment (2026-10-26): the testing bullet

This record said that the architecture skill governs structure while the test
suite is the gate. The test suite went with the harness in #43, so the second
half of that stopped being true. The gate is now the size budget, the
guardrail check, and `nx affected` over lint, format, typecheck, build and
build-storybook. There is no separate test suite.

The brief does not mention testing at all — not as a requirement and not as a
suggestion — so nothing here falls short of it. This is the same kind of
recorded exclusion as the ones above, and it is recorded for the same reason:
an unexplained absence reads as an oversight, and a recorded one reads as
judgement. What verifies the features and the screens is the type system, the
boundary rules and the walkthrough. See 0015.
