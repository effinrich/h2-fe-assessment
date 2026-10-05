SUPERGOAL_PHASE_START
Phase: 1 of 6 — Lock remaining spec list
Task: Make specs match shipped code and export isCropFrameShape
Type: brownfield
Mandatory commands: bunx nx run @h2-fe/camera:lint, bunx nx run @h2-fe/camera:typecheck, bunx nx run @h2-fe/camera:test
Acceptance criteria: 5
Evidence required: rg isCropFrameShape, nx last-10 + exit codes, spec diff hunks
Depends on phases: none

## Why

Specs currently lie (done work still unchecked; `isCropFrameShape` is named in the camera spec and missing). Later phases cannot close “remaining work” until the list is honest.

## Work

- Read `docs/specs/task-3-pin.md` and `pin-settle.stories.tsx`. If the settle story still asserts rotate-off detach + undo, tick `RotateOffPinDetaches`. Otherwise leave `[ ]` and add a one-line note.
- Add `isCropFrameShape` in `libs/web/features/camera/src/lib/utils.ts` (true iff `shape.type === CROP_FRAME` / `'crop-frame'`). Export it from the camera barrel (`src/index.ts`).
- Add `utils.spec.ts` cases: crop-frame true, other type false.
- Update `docs/specs/task-4-camera.md` barrel list so `isCropFrameShape` is present. Do **not** tick `exportShapeIds` / `EXPORT_EDGE_SLOP` (Phase 2). Tick `ToolbarA11y` only if the existing story already asserts names + description + announcement + Ctrl+Enter; add a `--tl-color-focus` or `outlineStyle: solid` assert if that is the only miss.
- Grep pin / camera / pdf-viewer `src` for sibling imports; they must stay empty.

## Acceptance criteria (all must pass — verify each in transcript)

- `isCropFrameShape` is exported from `@h2-fe/camera` and appears in `src/index.ts` (direct export or re-export).
- `utils.spec.ts` has a test that `isCropFrameShape({ type: 'crop-frame' })` is true and a non-crop type is false.
- `docs/specs/task-3-pin.md` has `- [x] **RotateOffPinDetaches**` only if the settle story still contains the detach + undo assertions; otherwise the box stays `[ ]` and a one-line note says why.
- `docs/specs/task-4-camera.md` barrel list matches the barrel (`isCropFrameShape` present; no claim that `EXPORT_EDGE_SLOP` exists yet).
- Pin / camera / pdf-viewer still have zero imports of each other (`rg` from each `src` to the others is empty).

## Mandatory commands (run each, surface last ~10 lines + exit code)

- `bunx nx run @h2-fe/camera:lint`
- `bunx nx run @h2-fe/camera:typecheck`
- `bunx nx run @h2-fe/camera:test`

## Evidence required in transcript

- `rg isCropFrameShape libs/web/features/camera/src` output
- Last ~10 lines + exit code of the three nx commands
- Diff hunk of the two spec files (only tick changes + barrel truth)

## Notes

Do not implement edge-scroll, clipped-child, French strings, or slop here. Spec-first: failing test for `isCropFrameShape` before the function if it is not already there.

AGENTS.md: `bunx nx`, never invent tldraw APIs, do not stage zips / `.github/agents/` / local vscode junk.

---

The agent will, during execution, print SUPERGOAL_PHASE_START (above),
do the work, then print SUPERGOAL_PHASE_VERIFY, MEMORY_SAVED, and
SUPERGOAL_PHASE_DONE in order. On failure, the agent follows the
3-strike recovery protocol in .supergoal/finish-remaining-hiring-brief-product-wo-5Z2dui/PROTOCOL.md without further
instruction needed here.
