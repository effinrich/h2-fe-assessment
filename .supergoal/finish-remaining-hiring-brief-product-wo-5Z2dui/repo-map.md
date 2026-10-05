# Repo map

_Generated 2026-10-04 17:46:35_

## Top-level layout

- AGENTS.md
- CLAUDE.md
- HARNESS.md
- README.md
- ai-guardrails.md
- apps
- bun.lock
- chromatic.config.json
- coverage
- dist
- docs
- handoff.md
- lefthook.yml
- libs
- llms-full.txt
- node_modules
- nx.json
- package.json
- skills
- skills-lock.json
- tools
- tsconfig.base.json
- tsconfig.json
- vitest.workspace.ts

## Source directories (depth 2)

### `apps/`

- apps/web
- apps/web/dist
- apps/web/out-tsc
- apps/web/public
- apps/web/src

## File counts (top extensions)

- `.tsx`: 96 files
- `.json`: 49 files
- `.ts`: 48 files
- `.md`: 33 files
- `.mts`: 9 files
- `.yml`: 3 files
- `.sh`: 2 files
- `.css`: 2 files
- `.txt`: 1 files
- `.lock`: 1 files

## Largest source files (top 15 by line count)

- `llms-full.txt` (78812 lines)
- `libs/web/features/camera/src/lib/camera.stories.tsx` (1205 lines)
- `libs/web/features/pdf-viewer/src/lib/pdf-viewer.spec.tsx` (683 lines)
- `libs/web/features/pin/src/lib/story-helpers.ts` (368 lines)
- `libs/web/features/pdf-viewer/src/lib/pdf-viewer.stories.tsx` (354 lines)
- `libs/web/features/pin/src/lib/pin-follow.stories.tsx` (328 lines)
- `libs/web/features/pin/src/lib/pin-attach.stories.tsx` (305 lines)
- `libs/web/features/pdf-viewer/src/lib/utils.ts` (302 lines)
- `libs/web/features/pin/src/lib/utils.spec.ts` (292 lines)
- `libs/web/features/pin/src/lib/pin-settle.stories.tsx` (282 lines)
- `libs/web/features/camera/src/lib/utils.spec.ts` (278 lines)
- `libs/web/features/pdf-viewer/src/lib/pdf-viewer.tsx` (277 lines)
- `libs/web/features/camera/src/lib/crop-export.ts` (181 lines)
- `libs/web/features/pin/src/lib/pin-settle.ts` (174 lines)
- `libs/web/features/camera/src/lib/utils.ts` (172 lines)

## Test surface

- Directories named `specs`: 1
- Test files (by name pattern): 37

## Notable config / infra

- `.github/workflows`
- `nx.json`
- `tsconfig.json`

## Recent activity (last 10 commits)

- `1a182e1` 2026-10-04 feat(pin,camera): ship attach tool and crop-frame export
- `9603e4f` 2026-10-04 docs(agents): record Chakra-vs-tldraw styling facts
- `f63b597` 2026-10-04 fix(pdf-viewer): keep the style panel below the viewer top bar
- `876da59` 2026-10-04 test(pdf-viewer): wait for color-mode toggle without forcing light
- `324bcea` 2026-10-04 test(pdf-viewer): compare resolved theme colors in Chromium
- `59b90d7` 2026-10-04 feat(ui): put ColorModeButton on home and the viewer bar
- `c3adbf6` 2026-10-04 feat(pdf-viewer): bridge tldraw CSS vars to Chakra tokens
- `dff8316` 2026-10-04 test(pdf-viewer): red tests for tldraw-Chakra theme bridge
- `96c52c2` 2026-10-04 docs(adr): tldraw and Chakra stay two styling systems
- `88a5321` 2026-10-04 fix(ci): upload Nx-built Storybook to Chromatic

## Files churned in last 20 commits (top 10)

- `libs/web/features/pdf-viewer/src/lib/pdf-viewer.stories.tsx` (7×)
- `libs/web/features/pdf-viewer/src/lib/pdf-viewer.spec.tsx` (5×)
- `docs/specs/task-2-pdf.md` (5×)
- `libs/web/features/pdf-viewer/src/lib/pdf-viewer.tsx` (4×)
- `libs/web/ui/src/lib/viewer-top-bar/viewer-top-bar.tsx` (3×)
- `libs/web/features/pdf-viewer/src/lib/utils.ts` (3×)
- `libs/web/features/pdf-viewer/src/lib/consts.ts` (3×)
- `apps/web/src/app/routes/pdf-viewer-route.tsx` (3×)
- `apps/web/src/app/routes/pdf-viewer-route.spec.tsx` (3×)
- `libs/web/features/pdf-viewer/src/lib/types.ts` (2×)

_End repo map._
