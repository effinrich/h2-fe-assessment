# `@h2-fe/camera`

Crop-frame export on the viewer canvas. The viewer route in `apps/web` mounts `createCameraExtension`.

Tags: `scope:web`, `type:feature`. Do not import `@h2-fe/pin` or `@h2-fe/pdf-viewer`.

This project has no Storybook target. Its stories are included by `shared-ui` and `@h2-fe/web-ui`.

## Public API

From `src/index.ts`:

- `createCameraExtension(options?)`: returns a `CameraExtension`, structurally a `CanvasExtension`. `options.documentName` names exported files.
- `getCropFrameBounds(editor)`: reactive page-space bounds of crop frames. The route passes it to the viewer as `retainPageBounds`, so pages under a frame stay rendered.
- `isCropFrameShape(shape)`, `CAMERA_TOOL_ID` (`"camera"`; shortcut **C**).
- Types: `CameraExtension`, `CameraExtensionOptions`, `CropAction`, `CropActionJob`, `CropActionState`, `CropFrameShape`, `CropFrameShapeProps`, `ExportCandidate`, `ExportFormat`, `ExportPixelSize`, `FrameSibling`.

See the [`CanvasExtension` reference](../../../../docs/reference/canvas-extension.md) and the [spec](../../../../docs/specs/task-4-camera.md).

From the repo root:

```sh
bunx nx run @h2-fe/camera:lint
bunx nx run @h2-fe/camera:test
bunx nx run @h2-fe/camera:typecheck
bunx nx run @h2-fe/camera:build
```
