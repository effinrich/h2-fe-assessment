SUPERGOAL_PHASE_START
Phase: 2 of 6 — Finish camera spec gaps
Task: Ship leftover Task 4 code: edge-scroll, clipped-child, FR announcement, slop, dark corners
Type: brownfield
Mandatory commands: bunx nx run @h2-fe/camera:lint, bunx nx run @h2-fe/camera:typecheck, bunx nx run @h2-fe/camera:test, bunx nx run @h2-fe/web-ui:test-storybook
Acceptance criteria: 7
Evidence required: greps, story names, nx last-10 + exit codes, spec checkbox diff
Depends on phases: 1

## Why

These are the only remaining Task 4 product boxes that are still missing code. Feature stories run on `@h2-fe/web-ui:test-storybook`, not `@h2-fe/camera:test`.

## Work

- **Verify types first.** Installed tldraw 5.5: `editor.edgeScrollManager.updateEdgeScrolling(elapsed)` (`@tldraw/editor` EdgeScrollManager). Camera spec cites this. Do not invent a different name.
- `CameraDragging` `onTick`: call `editor.edgeScrollManager.updateEdgeScrolling(elapsed)` so a drag near the viewport edge pans and the marquee grows.
- Export membership: use `getShapeMaskedPageBounds` (not only `getShapePageBounds`) so a child clipped away by a tldraw frame is dropped.
- Add `EXPORT_EDGE_SLOP` (4 page units) in `consts.ts`; `exportShapeIds` keeps shapes whose masked bounds overlap the crop expanded by slop, drops those outside. Update `utils.spec.ts`.
- Register a French override so the crop-frame announcement is `Crop frame`, not the key `tool.crop-frame`.
- Dark-mode corners: when tldraw color mode is dark, corner marks use `brand.fg` (not `brand.solid`). Export still `darkMode: false`.
- Stories in `camera.stories.tsx`: `EdgeScrollWhileDragging`, `ClippedChildExcluded`, `LocalisedAnnouncement`; complete `FollowsCanvasColorMode` (dark class + corner = `brand.fg` + export `darkMode: false`).
- Tick the matching boxes in `docs/specs/task-4-camera.md` only after commands pass.
- Do not import pin or pdf-viewer from camera.

## Acceptance criteria (all must pass — verify each in transcript)

- `camera-tool.ts` contains `updateEdgeScrolling` on the dragging state’s `onTick` (or the installed equivalent if types differ — then cite the type).
- `crop-export.ts` / `utils.ts` calls `getShapeMaskedPageBounds` (not only `getShapePageBounds`) when deciding export membership.
- `EXPORT_EDGE_SLOP` is defined and referenced by `exportShapeIds`; `utils.spec.ts` keeps a shape whose overlap is within slop and drops one outside.
- A French locale path exists such that the crop-frame announcement string is `Crop frame` (grep the override; story `LocalisedAnnouncement` fails if the fallback key `tool.crop-frame` is spoken).
- `FollowsCanvasColorMode` story asserts the `dark` class **and** corner computed color equals `brand.fg` **and** export options include `darkMode: false`.
- `bunx nx run @h2-fe/web-ui:test-storybook` exits 0 after the new stories.
- The Task 4 boxes `EdgeScrollWhileDragging`, `ClippedChildExcluded`, `LocalisedAnnouncement`, `FollowsCanvasColorMode`, `exportShapeIds` are `[x]` in `task-4-camera.md`.

## Mandatory commands (run each, surface last ~10 lines + exit code)

- `bunx nx run @h2-fe/camera:lint`
- `bunx nx run @h2-fe/camera:typecheck`
- `bunx nx run @h2-fe/camera:test`
- `bunx nx run @h2-fe/web-ui:test-storybook`

## Evidence required in transcript

- Grep hits for `updateEdgeScrolling`, `getShapeMaskedPageBounds`, `EXPORT_EDGE_SLOP`, French “Crop frame”
- Story names present in `camera.stories.tsx`
- Last ~10 lines + exit codes of the four commands
- Spec checkbox diff

## Notes

Failing story/test before implementation. `test-storybook` needs Playwright Chromium already installed — do not reinstall. Camera has no `test-storybook` target of its own.

If `getShapeMaskedPageBounds` is not on the installed Editor type, stop and cite the type; do not invent a helper name.

---

The agent will, during execution, print SUPERGOAL_PHASE_START (above),
do the work, then print SUPERGOAL_PHASE_VERIFY, MEMORY_SAVED, and
SUPERGOAL_PHASE_DONE in order. On failure, the agent follows the
3-strike recovery protocol in .supergoal/finish-remaining-hiring-brief-product-wo-5Z2dui/PROTOCOL.md without further
instruction needed here.
