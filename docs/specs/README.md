# Specs

Spec-driven, then test-driven. Every task opens with a spec here — written before
any code — and no criterion is finished until a test fails without the change.

## The loop

1. **Write `docs/specs/<task>.md`** from [TEMPLATE.md](./TEMPLATE.md). Criteria
   must be falsifiable: "the pin attaches two overlapping shapes and moving one
   moves the other", not "the pin tool works".
2. **Write the failing test for the first criterion.** Run it. Watch it fail for
   the right reason — a test that fails because it cannot import the module has
   proven nothing.
3. **Commit the red test** on its own, or record its failure in the commit body.
   This is the evidence that the test came first rather than being back-filled to
   match finished code.
4. **Implement until green.** No criterion is touched out of order.
5. **Refactor with tests green.**
6. **Run the gates** (`bun run gate`). The `Stop` hook runs them anyway, so a red
   gate is not a finishable turn.
7. **Tick the criterion in the spec** and move to the next one.

A task is done when every criterion is ticked, every tick has a test that fails
without it, and the gates are green.

## Why this is written down

Discipline that lives in good intentions evaporates under time pressure, and
"we did TDD" is unfalsifiable after the fact. A committed red test is not. See
[ADR 0005](../decisions/0005-sdd-and-tdd.md).

## Who checks it

- **`builder`** writes the spec, the failing test, and the implementation.
- **`scope-guard`** reads the diff against the spec and reports both what is
  extra and what is unmet.
- **The `Stop` hook** runs the gates. It cannot verify that the test came first;
  only the commit history can, which is why step 3 exists.

## Scope

Every task in the brief gets a spec. Tasks 2, 3 and 4 are the ones with real
acceptance criteria; Task 1 is the repo itself and is covered by the ADRs.

Testing is deliberately **out** of the architecture skill, which governs file
structure. It is firmly **in** the repo — the test suite is the gate. The two
live in different places on purpose.
