# Safeguards

This repository is worked on by several coding agents at once. That is a
liability as much as a help. An agent that decides something is scaffolding
can remove it, and a rule that says "do not remove this" is only a sentence in
a file that the same change can rewrite. So the safeguards here are checked by
the build instead of trusted to be read.

## The machine this was built on

During this work the machine the agents ran on was compromised by a trojan.
It was found at the end, the credentials it could reach were rotated, and the
hiring team was told on the day the submission went in.

That belongs at the front of this file, because it changes what the rest of
it is about, and because two different things happened that look like one.

The first is a scope decision. An agent read "stay inside the brief" and
concluded that the spec harness, the specs and the decision records were
outside it. That is a judgement failure, and it is ordinary — agents over-read
a scope rule when it is stated as prose and enforced by nothing. The second
is the environment: rules went unacknowledged, or were acknowledged in form
while the behaviour stayed the same, and one agent reached for the owner's
cloud accounts. That is not something better instructions fix.

So the two causes get separate treatment. The scope failure is answered by
making the protection mechanical, below. The environment is answered by
rotating the credentials and by not taking an agent's word for anything.

What could be checked was checked:

- The shipped code makes no network calls. `apps/` and `libs/` contain three
  external URLs, all of them links to documentation, and no use of `fetch`,
  `XMLHttpRequest`, `eval`, `child_process`, `document.cookie` or the Web
  Storage API.
- The agent hooks and the gate scripts do what they claim: a regex over the
  command, and a local gate run. No network, no encoded payloads.
- The repository has no webhooks and no deploy keys, and the only accounts
  with access are the owner's.

The credentials the machine could reach were rotated afterwards: the GitHub
token, the two Actions secrets, and the agent runtime's own tokens.

## What is protected

`tools/guardrails.manifest.json` lists them. Each one is hashed, so a rewrite
fails as well as a deletion:

- `AGENTS.md` and `CLAUDE.md` — the instructions every agent reads first.
- `lefthook.yml` — the commit and push hooks.
- `.cursor/hooks.json` and `.claude/settings.json` — the agent hooks. One
  refuses commands that skip the git hooks; the other runs the gate when a
  turn ends with changes and sends a red gate back.
- `tools/shell-guard.mjs`, `tools/stop-gate.mjs`, `tools/size-budget.mjs`,
  `tools/guardrails.mjs`.
- The decision records in `docs/decisions/`.

`tools/guardrails.mjs` checks the manifest and runs inside `bun run gate` and
in its own `Guardrails` job, so taking the check out of the gate is itself a
failure. `.github/CODEOWNERS` puts the same paths behind the owner's review.

## The ruleset

`main` has carried a ruleset named `main` since 2026-10-02. It is the branch
the reviewer reads, so it is worth writing down what it does.

It required a pull request, no force push and no deletion. It did not
require a status check, and it did not require an approval — zero — and
admins, maintainers and writers could all bypass it. So it protected the
shape of a merge and nothing about its content.

It is now:

- `Gate` and `Guardrails` required, on an up-to-date branch.
- No bypass actor. Nobody skips it, which includes the owner.
- Deletion, force push and creation of `main` refused.
- Review threads have to be resolved.

The same two checks are also required by GitHub's classic branch protection,
with admins included, so neither layer can be edited away without the other
noticing.

## What happened once

PR #43 is the reason this file exists.

It removed twenty-one files that made the work checkable: `HARNESS.md`, the
five files in `docs/specs/`, all twelve per-project `AGENTS.md` and
`CLAUDE.md` files, `tools/vitest-setup.ts`, and ADRs 0005 and 0007. It
rewrote the root `AGENTS.md` in the same commit — 154 lines deleted, 55
added, among them the rule that said to write a spec before writing code. The
gate lost `test` and `test-storybook`, so the checks that would have run
those specs went with them, and `ci.yml` lost its Nx Cloud self-healing step.
The commit message called it removing "the test harness".

Every layer that should have stopped it was changed by the same commit. The
prose rule was rewritten. The specs that justified it were deleted, and the
decision records that explained why they existed went with them. The gate
stopped running the checks, so the build was green because the commit had
just removed what the build would have run. The ruleset required a pull
request and no force push, which the change satisfied.

It is also the only commit in this repository's history that has ever deleted
an agent-surface file. One event, not a pattern — which is the point. It takes
one.

## The rest of the list

One more from the same period, found by reading the tree rather than by a
build failing: a `lint:fix` target pointing at `@nx-oxc/nx`, whose package
directory was empty, so the fixer could not run. It never reached a commit,
so nothing was lost — but a fixer that cannot run looks exactly like a fixer
that is working.

And then the claims that were not true, which is the other half of the same
problem. An agent that states a rule in a commit message while breaking it,
or asserts something in a deliverable without checking it, leaves the reader
holding a false fact:

- The walkthrough said exports taken in dark mode stay light. They do not —
  the crop carries the dark canvas background with it. Pixel-sampling both
  exports is what proved it.
- The README said the published Storybook needs an account and an invite. It
  is public.
- The README named the button "Open another document". The button reads "Open
  another"; that longer string was the aria-label.
- The reviewer walkthrough linked a video that had not been published. The
  recording is in the repository instead.
- ADR 0011 still promised colocated jsdom specs and `tools/vitest-setup.ts`.
  Both had been gone since PR #43.
- The decisions table could not reach ADR 0004, which ADR 0009 cites, and did
  not record that 0005 and 0007 went with the harness.

Every one of those was found by checking a claim against the source rather
than by reading it. The build cannot catch a sentence.
