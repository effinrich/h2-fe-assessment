# THINKING

## Goals

Close the remaining hiring-brief product work on `fixing-and-cleanup` so a reviewer can run, grade, and walk the four tasks without guessing.

Done is not “every scheduled PDF performance extra.” Done is:

1. Specs tell the truth (proven boxes ticked; remaining camera/viewer gaps actually shipped or recorded as won’t-ship).
2. Camera leftover criteria that are real code (edge-scroll, clipped children, French announcement, `isCropFrameShape`, `EXPORT_EDGE_SLOP`, dark-mode corners) exist and have stories/tests.
3. Viewer route proves crop export includes `shape:page-1` and retain-under-frame.
4. Brand is no longer stock Tailwind indigo — one token file, light/dark, canvas still bridged (ADR 0013).
5. Root README is a 5-minute reviewer walkthrough.
6. Polish pass: Task 2 narrow-width keyboard a11y, pin first-use hint, honest `handoff.md`, `bun run gate` green, light+dark screenshots.

## Constraints

- Pin / camera / pdf-viewer must not import each other. Route composes extensions.
- Verify every tldraw call against installed 5.5 types. Camera spec already cites `editor.edgeScrollManager.updateEdgeScrolling(elapsed)`.
- Locked shapes need `editor.run(..., { ignoreShapeLock: true })`.
- Never update image asset `src` in place (ADR 0012).
- Chakra for owned chrome via `chakra()`; tldraw CSS vars / component overrides for canvas UI; StyleProps only for persisted shape data.
- bun / `bunx nx` only. Do not stage zips, `.github/agents/`, local `.gitignore` / `.vscode` junk.
- Do not delete config files.
- Theme taste-pass was reserved by the user; this plan still does a **token swap** (assumption — they can drop Phase 4).
- Scheduled Task 2 performance debts stay debts (ADR 0009 / spec “Scheduled”).

## Risks

1. **Edge-scroll + clipped-export are easy to fake.** A story that only mounts is not the criterion. Mitigation: implement `onTick` → `updateEdgeScrolling`; export uses `getShapeMaskedPageBounds`; tests fail if the helper is missing or the slop constant is unused.
2. **Theme swap without a DESIGN.md.** Wrong hue is cheap to undo; wrapping tldraw or remounting `Tldraw` is not. Mitigation: edit `system.ts` (+ optional canvas-bg un-map in `tldraw-theme.css`). No new token file, no Tailwind, no `chakra(DefaultToolbar)`.
3. **Viewer PDF export tests in jsdom.** Hard to load a real PDF + editor. Mitigation: prefer a route/story play that drives the composed editor; if jsdom cannot, a `@h2-fe/web-ui` story with the example PDF is the evidence. Do not tick the spec on a mock that never calls `exportShapeIds`.

## Dependencies

- Phase 2 (camera export plan) before Phase 3 (viewer proof) — retain/export tests are meaningless if clipped-child / slop / page-id inclusion are still wrong.
- Phase 4 (tokens) is independent of 2/3. Droppable.
- Phase 5 (README) can start after 1 so the remaining-list is honest; it may mention 2–4 as shipped if those phases already landed.
- Phase 6 last. Always.

## Feature vs route (user feedback, 2026-10-04)

A feature is **an independently shippable user capability** with its own public API, spec, and tests, that **must not import its siblings**. A route is a **composition surface** in `apps/web`, not the definition of a feature.

- Home and PDF viewer are features _and_ routes (the capability _is_ a destination).
- Pin and camera are features _and not_ routes: canvas tools composed onto `/viewer`. They stay sibling libs because ADR 0011 forbids pin ↔ camera ↔ pdf-viewer imports. Folding them into pdf-viewer would make a god-feature and a cycle.

Heuristic for new work: “if it needs a URL, it is probably a feature.” The converse is false. Canvas extensions are features because they are capabilities with an extension API, not because they have a page.

This run does **not** merge camera/pin into pdf-viewer.

## Open questions (assumed)

- Theme is in scope as a one-file retoken, not a redesign. User can drop Phase 4 at Stage 6.
- Walkthrough video is out. Appreciated by the brief, not a phase.
- Chromatic for web-ui stays deferred (ADR 0011).
- 44px top-bar / toaster restyle: toaster placement is in Phase 6 if it is a few lines in `@h2-fe/ui`; a full chrome redesign is not.

## Memory hits applied

none.

## Tools / skills relied on

See `tools.md` and `applied-skills.md`. Context7 + installed types before new tldraw APIs. `@h2-fe/web-ui:test-storybook` for feature stories.

## Self-critique (Stage 6a)

- **Falsifiability:** Phase 3 “still exportable” was a vibe. Rewrote in place to “still present in the export plan / `exportShapeIds` result.”
- **Atomicity:** Phase 6 is the mandated polish bag. Phase 1 is one honesty increment (ticks + missing barrel predicate). No packed “and” names.
- **Weakest dependency:** Phase 2. A wrong export plan poisons Phase 3. Types are cited (`updateEdgeScrolling`, `getShapeMaskedPageBounds`) so the executor cannot invent APIs.

## Best practices applied

- Spec-first: tick only what a test/story already proves; implement the rest with a failing story first.
- Ask the Nx graph for targets. Camera has no `test-storybook`; web-ui does.
- Recorded exclusions stay recorded (ADR 0009).
- Shortest diff that closes a named checkbox. No new abstractions.
