# Pages

Superdesign init: local-import dependency trees for each page. `node_modules` packages are noted in brackets but not expanded. Specs and stories are excluded.

## How `@h2-fe/*` imports resolve

`tsconfig.base.json` has **no `paths` aliases**. Workspace packages resolve through **bun workspaces** (`node_modules/@h2-fe/*` links) and each package's `exports` map. Each package's `"."` export has a custom `"@h2-fe/source"` condition pointing at its TypeScript source. TypeScript opts in with `"customConditions": ["@h2-fe/source"]` in `tsconfig.base.json`, and Vite with `resolve.conditions: [...defaultClientConditions, "@h2-fe/source"]` in `apps/web/vite.config.mts`. So the app consumes library source directly, with no prior build.

| Import              | Package dir                    | Resolves to (`@h2-fe/source` condition)     |
| ------------------- | ------------------------------ | ------------------------------------------- |
| `@h2-fe/ui`         | `libs/shared/ui`               | `libs/shared/ui/src/index.ts`               |
| `@h2-fe/web-ui`     | `libs/web/ui`                  | `libs/web/ui/src/index.ts`                  |
| `@h2-fe/pdf-viewer` | `libs/web/features/pdf-viewer` | `libs/web/features/pdf-viewer/src/index.ts` |
| `@h2-fe/pin`        | `libs/web/features/pin`        | `libs/web/features/pin/src/index.ts`        |
| `@h2-fe/camera`     | `libs/web/features/camera`     | `libs/web/features/camera/src/index.ts`     |

`@h2-fe/ui` is a barrel (`export *` of every component), so below each `@h2-fe/ui` import lists the symbols used and the file each one comes from.

## Shared shell (both pages)

```
apps/web/index.html
└── apps/web/src/main.tsx                     [react, react-dom/client, react-router-dom, @tanstack/react-query]
    ├── @h2-fe/ui → libs/shared/ui/src/index.ts
    │   └── UiProvider → libs/shared/ui/src/lib/provider/provider.tsx   [@chakra-ui/react, next-themes]
    │       ├── libs/shared/ui/src/lib/theme/system.ts                  [@chakra-ui/react]
    │       └── libs/shared/ui/src/lib/toaster/toaster.tsx              [@chakra-ui/react]
    │           └── libs/shared/ui/src/lib/toaster/consts.ts
    ├── apps/web/src/index.css
    └── apps/web/src/app/app.tsx               [react (lazy, Suspense), react-router-dom]
        ├── @h2-fe/ui
        │   ├── Center  → libs/shared/ui/src/lib/primitives/layout.ts
        │   └── Spinner → libs/shared/ui/src/lib/primitives/feedback.ts
        ├── apps/web/src/app/routes/home/home.tsx              (route "/", eager)
        └── apps/web/src/app/routes/pdf-viewer-route/pdf-viewer-route.tsx       (route "/viewer", lazy chunk)
```

## `/`: Home

Entry: `apps/web/src/app/routes/home/home.tsx`

```
apps/web/src/app/routes/home/home.tsx                 [react, react-router-dom]
├── @h2-fe/ui
│   └── toaster → libs/shared/ui/src/lib/toaster/consts.ts
├── apps/web/src/app/routes/home/home-screen/home-screen.tsx
│   ├── @h2-fe/ui
│   │   ├── Button          → libs/shared/ui/src/lib/button/button.tsx
│   │   ├── ColorModeButton → libs/shared/ui/src/lib/color-mode-button/color-mode-button.tsx   [lucide-react]
│   │   │   └── libs/shared/ui/src/lib/color-mode-button/hooks.ts                              [next-themes]
│   │   │       └── libs/shared/ui/src/lib/color-mode-button/types.ts
│   │   ├── FileUpload      → libs/shared/ui/src/lib/primitives/forms.ts
│   │   ├── Flex, Stack     → libs/shared/ui/src/lib/primitives/layout.ts
│   │   └── Heading, Text   → libs/shared/ui/src/lib/primitives/typography.ts
│   └── apps/web/src/app/routes/home/home-screen/types.ts
└── apps/web/src/app/routes/home/utils.ts             [pdf-lib]
```

## `/viewer`: PDF viewer canvas

Entry: `apps/web/src/app/routes/pdf-viewer-route/pdf-viewer-route.tsx`. Leaf files reached more than once are marked `(↑ above)` after their first expansion.

```
apps/web/src/app/routes/pdf-viewer-route/pdf-viewer-route.tsx          [react, react-router-dom]
├── @h2-fe/ui
│   ├── Button     → libs/shared/ui/src/lib/button/button.tsx
│   ├── Flex       → libs/shared/ui/src/lib/primitives/layout.ts
│   ├── Modal      → libs/shared/ui/src/lib/modal/modal.tsx
│   └── Text       → libs/shared/ui/src/lib/primitives/typography.ts
│
├── @h2-fe/pdf-viewer → libs/web/features/pdf-viewer/src/index.ts
│   ├── lib/pdf-viewer.tsx                            [react, tldraw, tldraw/tldraw.css]
│   │   ├── lib/tldraw-theme.css
│   │   ├── @h2-fe/ui
│   │   │   ├── Button                 → libs/shared/ui/src/lib/button/button.tsx
│   │   │   ├── Heading, Text          → libs/shared/ui/src/lib/primitives/typography.ts
│   │   │   ├── Spinner                → libs/shared/ui/src/lib/primitives/feedback.ts
│   │   │   ├── Stack                  → libs/shared/ui/src/lib/primitives/layout.ts
│   │   │   └── useColorMode           → libs/shared/ui/src/lib/color-mode-button/hooks.ts
│   │   ├── @h2-fe/web-ui → libs/web/ui/src/index.ts
│   │   │   └── libs/web/ui/src/lib/viewer-top-bar/viewer-top-bar.tsx   [react]
│   │   │       └── @h2-fe/ui
│   │   │           ├── Button                → libs/shared/ui/src/lib/button/button.tsx
│   │   │           ├── ColorModeButton       → libs/shared/ui/src/lib/color-mode-button/color-mode-button.tsx (+ hooks.ts, types.ts)
│   │   │           ├── Field, Input          → libs/shared/ui/src/lib/primitives/forms.ts
│   │   │           ├── Flex                  → libs/shared/ui/src/lib/primitives/layout.ts
│   │   │           └── Text                  → libs/shared/ui/src/lib/primitives/typography.ts
│   │   ├── lib/types.ts                              [react, tldraw (types)]
│   │   ├── lib/consts.ts                             [tldraw (types)]
│   │   ├── lib/partials/canvas-components.tsx        [tldraw]
│   │   │   ├── lib/types.ts (↑ above)
│   │   │   ├── lib/consts.ts (↑ above)
│   │   │   └── lib/partials/viewer-chrome.tsx
│   │   ├── lib/partials/viewer-chrome.tsx
│   │   │   └── @h2-fe/ui
│   │   │       └── chakra → libs/shared/ui/src/lib/primitives/layout.ts
│   │   └── lib/utils.ts                              [pdfjs-dist, pdfjs-dist/build/pdf.worker.mjs?url, tldraw]
│   │       ├── lib/types.ts (↑ above)
│   │       └── lib/consts.ts (↑ above)
│   ├── lib/types.ts (↑ above)
│   ├── lib/hooks.ts                                  [@tanstack/react-query]
│   │   ├── lib/types.ts (↑ above)
│   │   └── lib/utils.ts (↑ above)
│   └── lib/utils.ts (↑ above)   (isPdfPageShape)
│
├── @h2-fe/pin → libs/web/features/pin/src/index.ts
│   ├── lib/consts.ts                                 [tldraw (types)]
│   ├── lib/types.ts                                  [react, tldraw (types)]
│   └── lib/pin-extension.ts                          [react (createElement)]
│       ├── lib/types.ts, lib/consts.ts (↑ above)
│       ├── lib/first-use-hint.tsx                    [tldraw]
│       │   ├── @h2-fe/ui
│       │   │   ├── Box   → libs/shared/ui/src/lib/primitives/layout.ts
│       │   │   └── Text  → libs/shared/ui/src/lib/primitives/typography.ts
│       │   ├── lib/pin-tool.ts (type import)
│       │   └── lib/consts.ts
│       ├── lib/partials/pin-icon.tsx                 [lucide-react]
│       │   └── @h2-fe/ui
│       │       └── Box → libs/shared/ui/src/lib/primitives/layout.ts
│       ├── lib/pin-binding-util.ts                   [tldraw]
│       │   ├── lib/types.ts, lib/consts.ts
│       │   ├── lib/pin-follow.ts
│       │   └── lib/utils.ts
│       ├── lib/pin-feedback-overlay.ts               [tldraw]
│       │   ├── lib/consts.ts
│       │   └── lib/pin-queries.ts
│       ├── lib/pin-follow.ts                         [tldraw]
│       │   ├── lib/types.ts, lib/consts.ts
│       │   ├── lib/pin-queries.ts
│       │   └── lib/utils.ts
│       ├── lib/pin-settle.ts                         [tldraw]
│       │   ├── lib/types.ts, lib/consts.ts
│       │   ├── lib/pin-follow.ts (↑ above)
│       │   ├── lib/pin-queries.ts
│       │   └── lib/utils.ts
│       ├── lib/pin-shape-util.tsx                    [tldraw]
│       │   ├── lib/types.ts, lib/consts.ts
│       │   ├── lib/partials/pin-glyph.tsx
│       │   │   ├── lib/types.ts
│       │   │   └── lib/consts.ts
│       │   ├── lib/partials/pin-view.tsx             [tldraw]
│       │   │   ├── @h2-fe/ui
│       │   │   │   └── Box, BoxProps → libs/shared/ui/src/lib/primitives/layout.ts
│       │   │   ├── lib/types.ts, lib/consts.ts
│       │   │   └── lib/partials/pin-glyph.tsx (↑ above)
│       │   ├── lib/pin-feedback-overlay.ts (↑ above)
│       │   └── lib/utils.ts
│       ├── lib/pin-tool.ts                           [tldraw]
│       │   ├── lib/pin-settle.ts (type import)
│       │   ├── lib/consts.ts
│       │   ├── lib/first-use-hint.tsx (↑ above)
│       │   └── lib/utils.ts
│       ├── lib/pin-queries.ts                        [tldraw (types)]
│       │   ├── lib/types.ts
│       │   └── lib/consts.ts
│       └── lib/utils.ts                              [tldraw]
│           ├── lib/types.ts
│           └── lib/consts.ts
│
└── @h2-fe/camera → libs/web/features/camera/src/index.ts
    ├── lib/camera.tsx                                [lucide-react, react, tldraw]
    │   ├── lib/types.ts                              [react, tldraw (types)]
    │   ├── lib/camera-tool.ts                        [tldraw]
    │   │   ├── lib/types.ts, lib/consts.ts
    │   │   ├── lib/first-use-hint/first-use-hint.tsx
    │   │   └── lib/utils/utils.ts
    │   ├── lib/consts.ts                             [tldraw (tlenv)]
    │   │   └── lib/types.ts
    │   ├── lib/crop-frame-toolbar/crop-frame-toolbar.tsx   [lucide-react, react, tldraw]
    │   │   ├── @h2-fe/ui
    │   │   │   ├── Box     → libs/shared/ui/src/lib/primitives/layout.ts
    │   │   │   ├── Spinner → libs/shared/ui/src/lib/primitives/feedback.ts
    │   │   │   └── Text    → libs/shared/ui/src/lib/primitives/typography.ts
    │   │   ├── lib/types.ts, lib/consts.ts
    │   │   └── lib/crop-frame-toolbar/hooks.ts       [react, tldraw]
    │   │       ├── lib/types.ts, lib/consts.ts
    │   │       ├── lib/crop-export/crop-action-state.ts   [tldraw]
    │   │       │   ├── lib/types.ts, lib/consts.ts
    │   │       │   └── lib/crop-export/crop-export.ts
    │   │       ├── lib/crop-export/crop-export.ts    [tldraw]
    │   │       │   ├── @h2-fe/ui
    │   │       │   │   └── toaster → libs/shared/ui/src/lib/toaster/consts.ts
    │   │       │   ├── lib/types.ts, lib/consts.ts
    │   │       │   └── lib/utils/utils.ts
    │   │       └── lib/utils/utils.ts
    │   ├── lib/crop-frame/crop-frame-shape-util.tsx  [tldraw]
    │   │   ├── @h2-fe/ui
    │   │   │   └── Box → libs/shared/ui/src/lib/primitives/layout.ts
    │   │   ├── lib/types.ts, lib/consts.ts
    │   │   ├── lib/utils/utils.ts
    │   │   └── lib/crop-frame/crop-frame-outline.tsx [react]
    │   │       ├── @h2-fe/ui
    │   │       │   ├── Box  → libs/shared/ui/src/lib/primitives/layout.ts
    │   │       │   └── Text → libs/shared/ui/src/lib/primitives/typography.ts
    │   │       └── lib/consts.ts
    │   ├── lib/crop-frame/crop-marquee.tsx           [tldraw]
    │   │   ├── @h2-fe/ui
    │   │   │   └── Box → libs/shared/ui/src/lib/primitives/layout.ts
    │   │   ├── lib/camera-tool.ts (type import)
    │   │   ├── lib/consts.ts
    │   │   ├── lib/utils/utils.ts
    │   │   └── lib/crop-frame/crop-frame-outline.tsx (↑ above)
    │   ├── lib/crop-shortcuts.ts                     [tldraw (types)]
    │   │   ├── lib/consts.ts
    │   │   └── lib/crop-export/crop-action-state.ts (↑ above)
    │   ├── lib/export-actions.ts                     [tldraw (types)]
    │   │   ├── lib/types.ts
    │   │   └── lib/consts.ts
    │   ├── lib/first-use-hint/first-use-hint.tsx     [tldraw]
    │   │   ├── @h2-fe/ui
    │   │   │   ├── Box  → libs/shared/ui/src/lib/primitives/layout.ts
    │   │   │   └── Text → libs/shared/ui/src/lib/primitives/typography.ts
    │   │   ├── lib/camera-tool.ts (type import)
    │   │   └── lib/consts.ts
    │   └── lib/style-panel-guard.tsx                 [react, tldraw]
    │       └── lib/consts.ts
    ├── lib/consts.ts (↑ above)
    ├── lib/types.ts (↑ above)
    └── lib/utils/utils.ts                            [tldraw]
        ├── lib/types.ts
        └── lib/consts.ts
```

Paths under each feature are relative to that feature's `src/` (for example `libs/web/features/camera/src/lib/camera.tsx`).

## Package entry points

`libs/web/features/pdf-viewer/src/index.ts` (4 lines)

```ts
export * from "./lib/pdf-viewer"
export * from "./lib/types"
export * from "./lib/hooks"
export { isPdfPageShape } from "./lib/utils"
```

`libs/web/features/pin/src/index.ts` (3 lines)

```ts
export { PIN_TOOL_ID } from "./lib/consts"
export { createPinExtension } from "./lib/pin-extension"
export type { PinExtension, PinExtensionOptions } from "./lib/types"
```

`libs/web/features/camera/src/index.ts` (16 lines)

```ts
export { createCameraExtension, getCropFrameBounds } from "./lib/camera"
export { CAMERA_TOOL_ID } from "./lib/consts"
export type {
  CameraExtension,
  CameraExtensionOptions,
  CropAction,
  CropActionJob,
  CropActionState,
  CropFrameShape,
  CropFrameShapeProps,
  ExportCandidate,
  ExportFormat,
  ExportPixelSize,
  FrameSibling
} from "./lib/types"
export { isCropFrameShape } from "./lib/utils/utils"
```

`libs/web/ui/src/index.ts` (1 lines)

```ts
export * from "./lib/viewer-top-bar/viewer-top-bar"
```
