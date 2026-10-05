SUPERGOAL_PHASE_START
Phase: 3 of 6 — Prove viewer crop export
Task: Prove a crop over page 1 exports and retains shape:page-1
Type: brownfield
Mandatory commands: bunx nx run @h2-fe/web:lint, bunx nx run @h2-fe/web:typecheck, bunx nx run @h2-fe/web:test
Acceptance criteria: 5
Evidence required: quoted assertion source, nx last-10 + exit codes, spec checkbox diff
Depends on phases: 2

## Why

The route already composes `createCameraExtension` and `retainPageBounds={getCropFrameBounds}`. The brief-facing proof (PDF page in the export; page retained off-viewport) was never written.

## Work

- Prefer extending `apps/web/src/app/routes/pdf-viewer-route.spec.tsx` or adding a web-ui / route story that loads the example PDF.
- Place a crop-frame over page 1. Assert the export plan / `exportShapeIds` result includes `shape:page-1`.
- Pan until page 1 would leave the default viewport. Assert `shape:page-1` still exists and is still in the export plan.
- If jsdom cannot host a real editor + PDF, put the proof in `@h2-fe/web-ui` stories (feature glob already picks up camera/pdf-viewer). Then also run `bunx nx run @h2-fe/web-ui:test-storybook`.
- Do **not** tick the spec on a mock that never calls `exportShapeIds` / `getCropExportPlan`.
- Composer stays `apps/web` (or a test of that route). Pin must not import camera; camera must not import pdf-viewer.
- Tick the two viewer boxes in `docs/specs/task-4-camera.md` only after the assertions pass.

## Acceptance criteria (all must pass — verify each in transcript)

- A test or story play function in this repo asserts the export plan / `exportShapeIds` result includes `shape:page-1` for a crop overlapping page 1 of a loaded document.
- A test or story play function asserts that after a pan that would evict page 1 from the default viewport, `shape:page-1` still exists on the editor page and is still present in the export plan / `exportShapeIds` result.
- Those tests do not import `@h2-fe/pin` from camera or `@h2-fe/camera` from pin; the route (or a test of the route) is the composer.
- Both viewer boxes in `task-4-camera.md` (“includes the PDF page” and “retains pages under a frame”) are `[x]`.
- `bunx nx run @h2-fe/web:test` exits 0. If the proof lives in web-ui stories, `bunx nx run @h2-fe/web-ui:test-storybook` exits 0 as well.

## Mandatory commands (run each, surface last ~10 lines + exit code)

- `bunx nx run @h2-fe/web:lint`
- `bunx nx run @h2-fe/web:typecheck`
- `bunx nx run @h2-fe/web:test`

## Evidence required in transcript

- Quoted assertion source (file + line) for both boxes
- Last ~10 lines + exit codes
- Spec checkbox diff

## Notes

ADR 0011: do not add pin/camera stories inside `libs/web/features/pdf-viewer`. Route or web-ui stage only.

If a real PDF + editor cannot be driven after one honest attempt, write the failing story, record `FAILURE_PROBE` with the blocker, and do not tick the spec.

---

The agent will, during execution, print SUPERGOAL_PHASE_START (above),
do the work, then print SUPERGOAL_PHASE_VERIFY, MEMORY_SAVED, and
SUPERGOAL_PHASE_DONE in order. On failure, the agent follows the
3-strike recovery protocol in .supergoal/finish-remaining-hiring-brief-product-wo-5Z2dui/PROTOCOL.md without further
instruction needed here.
