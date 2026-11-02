# Session transcripts

The brief names session transcripts with AI agents among the evidence it
likes. This is that evidence: the record of the session in which the
exercise was worked, sanitised so that it can be published at all.

## What is here

- [2026-10-25-the-exercise.md](2026-10-25-the-exercise.md) — the session the
  exercise was built in, from the first decision about the camera to the PDF
  export at the end. Eighty-six turns, eighteen hundred and thirty-four tool
  calls, and seven points where the context was compacted.

The session began on other work and was paused and resumed across several
days, so the transcript is one long conversation rather than a set of tidy
chapters. It is the record of how the work actually went, which includes the
parts that did not.

## How it was made

The sessions on this machine are the real ones. The runtime writes a message
log, and each time a conversation outgrows what it can carry, it writes a
snapshot of the conversation so far. The transcript is the union of the log
and the snapshots, merged by message identifier so that nothing is counted
twice and the order is the order things happened in.

Three kinds of thing were left out on purpose:

- **The injected context.** Every turn carries the runtime's reminders, the
  agent's instructions and its memory. It is context, not conversation, and
  it is most of the bytes.
- **The agent's private reasoning.** It is long, and it is not what a reader
  is looking for.
- **The raw tool output.** What a tool returned is in the agent's answer in
  almost every case, and the raw output is mostly megabytes of files.

What remains is what was asked, what was said, and which tools were used.

## The part that had to be removed

The snapshots carry the full context of the session, and one of them
includes the contents of a file on this machine that holds credentials. The
value is not in the transcript — it was replaced before the transcript was
written — but the snapshots themselves are not published, and the reason
they are not is that the session record is not safe to copy off the machine
as it stands.

Three of the snapshots in another session on this machine carry the same kind
of thing, and more of it: two of them hold the storage encryption key and
the CLI token salt as well as a password. That is why the check below runs
against the live files rather than against a list of token shapes.

This is the whole reason the brief's "no session transcripts" was ever true.
It was never that the transcripts did not exist. It was that the only copy of
them carried local paths, session identifiers and, in places, secrets, and
publishing that copy would have been publishing the machine.

## Checking it

Two checks ran over the transcript before it was committed.

The guardrail check in `bun run gate` reads every tracked text file for
tokens of known shapes — GitHub, Chromatic, Nx Cloud, AWS keys, private keys
— and fails the build if it finds one. The transcript is tracked, so it was
read that way.

The other check was run separately and is not part of the gate: the
transcript was searched for the exact values of the credentials held in the
files on this machine that were found in the snapshots. It does not contain
any of them. That check is worth repeating whenever a transcript is
rebuilt, because the gate cannot know what a random string on this machine
happens to be.
