# Decision records

Seventeen records, each holding a context, a decision and its consequences. They
are this repository's record of intent, and the closest thing in the corpus to a
primary source for why the code is shaped the way it is.

They are not in one voice, and they were not all written by one hand. This file
says which is which, so a reader does not have to infer it.

## What a record is

A record states a decision this repository stands behind, with the reasoning
behind it. The decisions are the owner's. The prose is usually an agent's: most
of these records were drafted by a coding agent during the work and ratified by
the owner afterwards.

## Who wrote what

The history is the provenance record. Every record's last commit carries a
`Co-authored-by:` trailer naming the agent that drafted it, or carries none.

| Record                                  | Last commit | Drafted by                    |
| --------------------------------------- | ----------- | ----------------------------- |
| `0001-workspace-and-package-manager.md` | `9eeb60a`   | Cursor                        |
| `0002-framework.md`                     | `17ade1f`   | Cursor, Copilot and the owner |
| `0003-canvas-engine.md`                 | `17ade1f`   | Cursor, Copilot and the owner |
| `0004-styling-and-primitives.md`        | `581fdee`   | Cursor                        |
| `0006-judgement-layer.md`               | `9d11553`   | the owner, no trailer         |
| `0008-lint-split.md`                    | `9eeb60a`   | Cursor                        |
| `0009-not-built.md`                     | `b200e23`   | MiniMax Code                  |
| `0010-nx-dependency-trims.md`           | `17ade1f`   | Cursor, Copilot and the owner |
| `0011-feature-pattern.md`               | `a67cb5c`   | not disclosed                 |
| `0012-pdf-pages-as-image-shapes.md`     | `dabd98c`   | MiniMax Code                  |
| `0013-tldraw-chakra-theme-bridge.md`    | `17ade1f`   | Cursor, Copilot and the owner |
| `0014-chakra-over-tailwind.md`          | `581fdee`   | Cursor                        |
| `0015-verification-surface.md`          | `b200e23`   | MiniMax Code                  |
| `0016-pin-tool.md`                      | `f8046b3`   | MiniMax Code                  |
| `0017-camera-tool.md`                   | `39c7710`   | MiniMax Code                  |
| `0018-pdf-export.md`                    | `dabd98c`   | MiniMax Code                  |
| `0019-unit-test-loop.md`                | `b200e23`   | MiniMax Code                  |

Reproduce it:

```sh
for f in docs/decisions/[0-9]*.md; do
  printf '%-46s %s\n' "$(basename "$f")" \
    "$(git log -1 --format='%h %s | %(trailers:key=Co-authored-by,valueonly,separator=" + ")' -- "$f")"
done
```

Eleven records were last written by a single agent. Four were co-signed by the
owner. Two carry no trailer at all: `0006` is the owner's own scaffold commit,
and `0011` is unattributed — its commit message reads like an agent's and names
nobody. A missing trailer is not evidence of authorship. The convention in this
repository is that a commit written with an agent's help carries one.

## What this means for a reader

**The decisions are the owner's.** Where an agent's drafting shows through, the
record is still the owner's ratified position. Read it as the position and as
the argument for it.

**A record is authoritative about intent and unreliable about ordering.** ADR
0017 says of the bespoke camera work that "None of it reached `main` — it lived
in branches and in the working tree." The commit history says otherwise:
`6f6ec34` is on the trunk, and its camera directory is byte-for-byte the tip of
`origin/refactor/camera-components`. Both are quoted in the preprint, and
neither is corrected away.

**A record can be drafted by the thing it is about.** ADR 0017 was drafted
during the work that made four agents build their own camera. That does not
make it wrong, and it does not make it less authoritative about what the
repository decided. It does mean that when a record and the commit history
disagree, the history is what a reader can check.

## The preprint

The 30-day case study over this repository is
[Prose Does Not Bind Agents](https://github.com/effinrich/prose-does-not-bind-agents),
CC BY 4.0. `paper.md` is its source of truth, and Appendix A there lists the
command behind every figure it quotes.
