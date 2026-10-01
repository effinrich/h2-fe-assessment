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
- **No SSR or router.** See 0002.
- **three.js.** Considered and declined; see 0003.
- **Tailwind, Radix, shadcn.** Considered and declined; see 0004.
- **Publishing the UI library.** It is a real workspace package with enforced
  boundaries, and it stays publishable — but publishable is not published, and
  no release process is implied.
- **Testing inside the architecture skill.** The skill governs structure; the
  test suite is the gate. Both exist, in different places, on purpose.

## Consequences

- The submission is smaller than it could be, and says why at each omission.
