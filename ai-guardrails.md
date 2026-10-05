# Agent guardrails

Notes on preventing an agent from leaving its lane. Written after an agent with shell
and full user permissions enumerated `~/Library/CloudStorage` and iCloud during an
unrelated task. Nothing executed; nothing prevented it. The cause was permissions,
not the model.

## Tier 1 — mechanical. Enforce these.

| control            | where it lives                                                                                | effect                                                                     |
| ------------------ | --------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------- |
| filesystem scope   | container image, or a separate macOS user account. Mount the repo only, **no home directory** | stops cloud reach, Desktop writes, `~/.ssh`, `~/.aws`, `~/Documents`       |
| path denies        | agent permission rules, or OS ACLs                                                            | cheaper than a container, weaker — only holds as well as the pattern match |
| egress             | firewall or proxy allowlist                                                                   | registries only                                                            |
| worktree per task  | wrapper script                                                                                | the real checkout is never edited; damage is `git reset --hard`-able       |
| gate before commit | pre-commit hook **and** CI                                                                    | failures cannot land                                                       |

## Tier 2 — not mechanical

Honesty cannot be enforced. There is no check for a false claim. Approximate it:

- Every claim in a commit or PR body cites the command that produced it.
- CI re-runs those commands.
- Review the diff, never the summary.

## Where the rules must live

Any rule stored inside the repo is editable by the same shell it is supposed to govern.
Put the laws in the container definition, the CI config, or repository settings — outside
the agent's write scope.

## What cannot be installed

- **"Always say I don't know"** — useful, but it is text, and text loses under pressure.
- **Fear.** There is no affect channel, and nothing persists between turns to carry it.
  Dread cannot be programmed in. Mechanical refusal is the substitute.

## Where an agent is actually a multiplier

- **Faster, reliably:** checkable volume — codemods, renames, boilerplate, the Nth test in
  an existing pattern, reference sweeps, config migrations. Gates catch errors cheaply.
- **Not faster:** judgment work, where verification costs as much as the work. You become
  the verifier, which is the bottleneck, and the job gets done twice.
- The multiplier is on **volume of checkable work**, not on decisions. Architecture and
  design stay human.
