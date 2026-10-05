# Roadmap: Finish remaining hiring-brief product work

**Task:** Close leftover pin/camera/viewer criteria, retoken brand, and leave a reviewer-ready README + polish pass.
**Type:** brownfield, ui
**Created:** 2026-10-04
**Total phases:** 6

## Context summary

- **Stack:** Nx 23 + bun · Vite · React 19 · TS strict · Chakra v3 · tldraw 5.5 · Storybook 10 · Vitest
- **Package manager:** bun
- **Build / test / lint commands:** `bunx nx run <project>:{lint,typecheck,test}` · feature stories via `bunx nx run @h2-fe/web-ui:test-storybook` · full gate `bun run gate`
- **Risky areas:** inventing tldraw APIs; wrapping tldraw in `chakra()`; pin/camera/viewer importing each other; jsdom PDF export tests that never touch the editor

## Assumptions

Non-blocking decisions recorded here so we can proceed without round-trips. If any are wrong, stop the run and tell us:

- Theme is in scope as a **one-file retoken** of `brand` in `libs/shared/ui/src/lib/theme/system.ts` (drop Tailwind indigo). Not a new design system. User reserved taste; this still ships an intentional palette. Drop Phase 4 to skip.
- Scheduled Task 2 performance extras (raster cache, 100-page example, Blob URLs, zoom×dpr, camera constraints) stay documented debts.
- Walkthrough video and web-ui Chromatic tokens stay out.
- Do not rewrite pin/camera; only close named leftover criteria.
- `handoff.md` is rewritten in Phase 6 so it matches HEAD (`1a182e1`+), not used as a spec.

## Risk top 3

1. **Edge-scroll / clipped-export faked** — likelihood: M, mitigation: `onTick` must call `editor.edgeScrollManager.updateEdgeScrolling`; export uses `getShapeMaskedPageBounds`; tests fail if helpers are unused.
2. **Theme swap drifts into a redesign** — likelihood: M, mitigation: `system.ts` (+ optional `--tl-color-background` un-map). No new token file, no remount of `Tldraw`.
3. **Viewer PDF proof in jsdom** — likelihood: M, mitigation: story/play on the composed route or web-ui with the example PDF; do not tick the spec on a mock that never calls `exportShapeIds`.

## Phase map

| #   | Phase                    | Depends on | Deliverable                                                         |
| --- | ------------------------ | ---------- | ------------------------------------------------------------------- |
| 1   | Lock remaining spec list | —          | Specs match code; `isCropFrameShape` exported + tested              |
| 2   | Finish camera spec gaps  | 1          | Edge-scroll, clipped-child, FR announcement, slop, dark corners     |
| 3   | Prove viewer crop export | 2          | Route/story proves PDF page in export + retain-under-frame          |
| 4   | Retoken brand palette    | 1          | Brand is not Tailwind indigo; light/dark + canvas bridge still hold |
| 5   | Write reviewer README    | 1          | Root README is a 5-minute walkthrough                               |
| 6   | Polish & Harden          | 1..5       | A11y, pin hint, handoff, gate, screenshots                          |

---

## Phase 1 — Lock remaining spec list

**Why:** Specs currently lie (done work still unchecked; `isCropFrameShape` is named and missing). A later `/goal` cannot close “remaining work” until the list is honest.

**Deliverables:**

- `docs/specs/task-3-pin.md` (`RotateOffPinDetaches` ticked iff `pin-settle.stories.tsx` still asserts detach + undo)
- `docs/specs/task-4-camera.md` (tick only boxes already proven: `ToolbarA11y` after a `--tl-color-focus` or `outlineStyle` assert; `exportShapeIds` stays unchecked until Phase 2 adds slop)
- `libs/web/features/camera/src/lib/utils.ts` — `isCropFrameShape`
- `libs/web/features/camera/src/index.ts` — barrel export
- `libs/web/features/camera/src/lib/utils.spec.ts` — true for `crop-frame`, false otherwise

**Acceptance criteria:**

- [ ] `isCropFrameShape` is exported from `@h2-fe/camera` and appears in `src/index.ts` (direct export or re-export).
- [ ] `utils.spec.ts` has a test that `isCropFrameShape({ type: 'crop-frame' })` is true and a non-crop type is false.
- [ ] `docs/specs/task-3-pin.md` has `- [x] **RotateOffPinDetaches**` only if the settle story still contains the detach + undo assertions; otherwise the box stays `[ ]` and a one-line note says why.
- [ ] `docs/specs/task-4-camera.md` barrel list matches the barrel (`isCropFrameShape` present; no claim that `EXPORT_EDGE_SLOP` exists yet).
- [ ] Pin / camera / pdf-viewer still have zero imports of each other (`rg` from each `src` to the others is empty).

**Mandatory commands:**

- `bunx nx run @h2-fe/camera:lint`
- `bunx nx run @h2-fe/camera:typecheck`
- `bunx nx run @h2-fe/camera:test`

**Evidence required:**

- `rg isCropFrameShape libs/web/features/camera/src` output
- Last ~10 lines + exit code of the three nx commands
- Diff hunk of the two spec files (only tick changes + barrel truth)

**Dependencies:** none

---

## Phase 2 — Finish camera spec gaps

**Why:** These are the only remaining Task 4 product boxes that are still missing code.

**Deliverables:**

- `libs/web/features/camera/src/lib/camera-tool.ts` — dragging `onTick` calls `editor.edgeScrollManager.updateEdgeScrolling(elapsed)` (verify against installed types first)
- `libs/web/features/camera/src/lib/crop-export.ts` — overlap uses `getShapeMaskedPageBounds` so clipped children drop
- `libs/web/features/camera/src/lib/consts.ts` — `EXPORT_EDGE_SLOP` (4 page units) used by `exportShapeIds`
- `libs/web/features/camera/src/lib/camera-extension.tsx` — French override announces “Crop frame”, not `tool.crop-frame`
- `libs/web/features/camera/src/lib/crop-frame-outline.tsx` — corner marks use `brand.fg` when tldraw color mode is dark
- Stories in `camera.stories.tsx`: `EdgeScrollWhileDragging`, `ClippedChildExcluded`, `LocalisedAnnouncement`, completed `FollowsCanvasColorMode`
- `docs/specs/task-4-camera.md` boxes ticked only after those stories/tests pass

**Acceptance criteria:**

- [ ] `camera-tool.ts` contains `updateEdgeScrolling` on the dragging state’s `onTick` (or the installed equivalent if types differ — then cite the type).
- [ ] `crop-export.ts` / `utils.ts` calls `getShapeMaskedPageBounds` (not only `getShapePageBounds`) when deciding export membership.
- [ ] `EXPORT_EDGE_SLOP` is defined and referenced by `exportShapeIds`; `utils.spec.ts` keeps a shape whose overlap is within slop and drops one outside.
- [ ] A French locale path exists such that the crop-frame announcement string is `Crop frame` (grep the override; story `LocalisedAnnouncement` fails if the fallback key `tool.crop-frame` is spoken).
- [ ] `FollowsCanvasColorMode` story asserts the `dark` class **and** corner computed color equals `brand.fg` **and** export options include `darkMode: false`.
- [ ] `bunx nx run @h2-fe/web-ui:test-storybook` exits 0 after the new stories.
- [ ] The four Task 4 boxes named above are `[x]` in `task-4-camera.md`.

**Mandatory commands:**

- `bunx nx run @h2-fe/camera:lint`
- `bunx nx run @h2-fe/camera:typecheck`
- `bunx nx run @h2-fe/camera:test`
- `bunx nx run @h2-fe/web-ui:test-storybook`

**Evidence required:**

- Grep hits for `updateEdgeScrolling`, `getShapeMaskedPageBounds`, `EXPORT_EDGE_SLOP`, French “Crop frame”
- Story names present in `camera.stories.tsx`
- Last ~10 lines + exit codes of the four commands
- Spec checkbox diff

**Dependencies:** phase 1

---

## Phase 3 — Prove viewer crop export

**Why:** The route already wires `getCropFrameBounds`; the brief-facing proof (PDF page in the export, page retained off-viewport) was never written.

**Deliverables:**

- `apps/web/src/app/routes/pdf-viewer-route.spec.tsx` and/or a web-ui / route story that loads the example PDF, places a crop over page 1, and asserts `shape:page-1` is in the export plan
- A second assertion: after panning until page 1 would leave the viewport, `shape:page-1` still exists and is still in the export plan
- `docs/specs/task-4-camera.md` viewer boxes ticked only if those assertions exist and pass

**Acceptance criteria:**

- [ ] A test or story play function in this repo asserts the export plan / `exportShapeIds` result includes `shape:page-1` for a crop overlapping page 1 of a loaded document.
- [ ] A test or story play function asserts that after a pan that would evict page 1 from the default viewport, `shape:page-1` still exists on the editor page and is still present in the export plan / `exportShapeIds` result.
- [ ] Those tests do not import `@h2-fe/pin` from camera or `@h2-fe/camera` from pin; the route (or a test of the route) is the composer.
- [ ] Both viewer boxes in `task-4-camera.md` are `[x]`.
- [ ] `bunx nx run @h2-fe/web:test` exits 0. If the proof lives in web-ui stories, `bunx nx run @h2-fe/web-ui:test-storybook` exits 0 as well.

**Mandatory commands:**

- `bunx nx run @h2-fe/web:lint`
- `bunx nx run @h2-fe/web:typecheck`
- `bunx nx run @h2-fe/web:test`

**Evidence required:**

- Quoted assertion source (file + line) for both boxes
- Last ~10 lines + exit codes
- Spec checkbox diff

**Dependencies:** phase 2

---

## Phase 4 — Retoken brand palette

**Why:** The hiring brief grades design consistency. Current `brand` is Tailwind indigo (`#6366f1` / `#4f46e5`) on every CTA and tldraw selection.

**Deliverables:**

- `libs/shared/ui/src/lib/theme/system.ts` — new `brand` scale; `brand.solid` adapts in dark (not the same 600)
- Optional: `libs/web/features/pdf-viewer/src/lib/tldraw-theme.css` — stop mapping `--tl-color-background` to Chakra `bg` if the canvas reads as a black void; keep text/panel/border/accent maps
- Existing `FollowsAppColorMode` / `Theme/UiProvider` stories still pass

**Acceptance criteria:**

- [ ] `system.ts` no longer uses Tailwind indigo 500/600 hexes `#6366f1` / `#4f46e5` as `brand.500` / `brand.600`.
- [ ] `brand.solid` in `_dark` is a different token than light `brand.solid`.
- [ ] `html { colorPalette: "brand" }` remains (one global palette, not a second system).
- [ ] `tldraw-theme.css` still maps `--app-accent` → `--tl-color-primary` / `--tl-color-selected`.
- [ ] `FollowsAppColorMode` still asserts `--tl-color-primary` equals `--app-accent`.
- [ ] No new file under `libs/shared/ui` named `*tokens*` / `*theme*` besides edits to `system.ts`.
- [ ] No `chakra()` wrapper added around `DefaultToolbar` or other `.tlui-*`.

**Mandatory commands:**

- `bunx nx run shared-ui:lint`
- `bunx nx run shared-ui:typecheck`
- `bunx nx run shared-ui:test-storybook`
- `bunx nx run @h2-fe/pdf-viewer:typecheck`

**Evidence required:**

- Before/after hex table for `brand.solid` / `brand.fg` / `brand.focusRing` (light + dark)
- Screenshot of home + viewer toolbar in light and dark (saved under the run root `qa/`)
- Last ~10 lines + exit codes

**Dependencies:** phase 1

---

## Phase 5 — Write reviewer README

**Why:** The brief grades teamwork. Root `README.md` is still the Nx starter; a reviewer cannot learn install, routes, or refusals from it.

**Deliverables:**

- `README.md` rewritten as a reviewer walkthrough (keep enough Nx facts to install)

**Acceptance criteria:**

- [ ] `README.md` contains `bun install` and `bunx nx serve @h2-fe/web` (or `bun run start`).
- [ ] `README.md` names `/` and `/viewer`.
- [ ] `README.md` states what we did better than the demo videos (persistent crop, pin attach, loading/error).
- [ ] `README.md` states what we refused (no backend, no whole-PDF export, no persistence across refresh) and points at `docs/decisions/0009-not-built.md`.
- [ ] `README.md` does not claim scheduled Task 2 performance extras are shipped.
- [ ] `README.md` is under 200 lines.

**Mandatory commands:**

- `bunx nx run @h2-fe/web:typecheck`

**Evidence required:**

- `wc -l README.md`
- Quoted headings from the new README
- Exit code of typecheck

**Dependencies:** phase 1

---

## Phase 6 — Polish & Harden

**Why:** Catch what earlier phases missed because they were focused on shipping leftover boxes.

**Deliverables:**

- Task 2 narrow-width keyboard a11y box ticked or a failing reason recorded
- Pin first-use hint (camera already has one)
- `handoff.md` rewritten to match current HEAD (Tasks 3/4 shipped; leftover list matches this roadmap)
- Toaster placement that clears tldraw’s bottom toolbar on a narrow viewport, if it is a small `@h2-fe/ui` change
- Light + dark + ~390px screenshots under the run root `qa/`
- `bun run gate` green

**Acceptance criteria:**

- [ ] **UX & copy** — no “TODO”, “lorem”, or `tool.crop-frame` visible strings in feature `src` (grep added lines).
- [ ] **States** — empty / loading / error still present on home + viewer (existing stories still pass).
- [ ] **Edges** — crop export still disabled on empty frame; pin still refuses PDF pages (`canAttach`).
- [ ] **Security** — no new secrets; PDF still client-side only.
- [ ] **A11y** — filename + page controls reachable by keyboard at ≤390px width (story or browser pass); camera toolbar still 44px.
- [ ] **Perf** — no new unbounded `collect`-style work; no new `console.log` in app `src`.
- [ ] **Diff review** — `git diff --stat` contains no `docs/*.zip`, `.github/agents/`, `.vscode/settings.json`.
- [ ] **Regression sweep** — `bun run gate` exits 0.
- [ ] `handoff.md` mentions pin + camera and does not claim they are stubs.

**Mandatory commands:**

- `bun run gate`

**Evidence required:**

- One paragraph per sub-pass
- Final `git diff --stat`
- Gate last ~15 lines + exit code
- Screenshot paths (light, dark, narrow)

**Dependencies:** phases 1, 2, 3, 4, 5
