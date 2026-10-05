SUPERGOAL_PHASE_START
Phase: 4 of 6 — Retoken brand palette
Task: Replace Tailwind indigo brand with an intentional palette that still bridges to tldraw
Type: brownfield, ui
Mandatory commands: bunx nx run shared-ui:lint, bunx nx run shared-ui:typecheck, bunx nx run shared-ui:test-storybook, bunx nx run @h2-fe/pdf-viewer:typecheck
Acceptance criteria: 7
Evidence required: hex table, qa/ screenshots light+dark, nx last-10 + exit codes
Depends on phases: 1

## Why

The brief grades design consistency. `brand` is stock Tailwind indigo (`#6366f1` / `#4f46e5`) on every CTA and on tldraw selection. User reserved a taste pass; this phase is a one-file retoken, not a redesign.

## Work

- Edit only `libs/shared/ui/src/lib/theme/system.ts` for the hue. Pick a calmer scale (not indigo 500/600). `brand.solid` in `_dark` must not be the same token as light.
- Keep `html { colorPalette: "brand" }`. Keep existing AA fixes on `fg.error` and the other solids unless they collide.
- Optional: in `libs/web/features/pdf-viewer/src/lib/tldraw-theme.css`, stop mapping `--tl-color-background` to Chakra `bg` if dark canvas is a black void. Keep `--app-accent` → `--tl-color-primary` / `--tl-color-selected`. Keep text/panel/border maps.
- Do **not** remount `Tldraw`. Do **not** wrap `DefaultToolbar` or `.tlui-*` in `chakra()`. Do **not** add a second token file.
- `FollowsAppColorMode` must still assert `--tl-color-primary` equals `--app-accent`.
- Browser: screenshot home + viewer toolbar, light and dark, save under `.supergoal/finish-remaining-hiring-brief-product-wo-5Z2dui/qa/`.

## Acceptance criteria (all must pass — verify each in transcript)

- `system.ts` no longer uses Tailwind indigo 500/600 hexes `#6366f1` / `#4f46e5` as `brand.500` / `brand.600`.
- `brand.solid` in `_dark` is a different token than light `brand.solid`.
- `html { colorPalette: "brand" }` remains (one global palette, not a second system).
- `tldraw-theme.css` still maps `--app-accent` → `--tl-color-primary` / `--tl-color-selected`.
- `FollowsAppColorMode` still asserts `--tl-color-primary` equals `--app-accent`.
- No new file under `libs/shared/ui` named `*tokens*` / `*theme*` besides edits to `system.ts`.
- No `chakra()` wrapper added around `DefaultToolbar` or other `.tlui-*`.

## Mandatory commands (run each, surface last ~10 lines + exit code)

- `bunx nx run shared-ui:lint`
- `bunx nx run shared-ui:typecheck`
- `bunx nx run shared-ui:test-storybook`
- `bunx nx run @h2-fe/pdf-viewer:typecheck`

## Evidence required in transcript

- Before/after hex table for `brand.solid` / `brand.fg` / `brand.focusRing` (light + dark)
- Screenshot paths of home + viewer toolbar in light and dark under the run root `qa/`
- Last ~10 lines + exit codes

## Notes

If the user dropped this phase at Stage 6, skip the whole spec and mark STATE skipped — do not retoken.

Serve may already be on http://localhost:4200/. Do not start a second server if 4200 is taken.

---

The agent will, during execution, print SUPERGOAL_PHASE_START (above),
do the work, then print SUPERGOAL_PHASE_VERIFY, MEMORY_SAVED, and
SUPERGOAL_PHASE_DONE in order. On failure, the agent follows the
3-strike recovery protocol in .supergoal/finish-remaining-hiring-brief-product-wo-5Z2dui/PROTOCOL.md without further
instruction needed here.
