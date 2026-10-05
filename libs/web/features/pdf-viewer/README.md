# `@h2-fe/pdf-viewer`

Places a PDF on a tldraw canvas and owns the viewer screen. The viewer route in `apps/web` hosts it and passes pin and camera in.

Tags: `scope:web`, `type:feature`. Do not import `@h2-fe/pin` or `@h2-fe/camera`.

This project has no Storybook target. Its stories are included by `shared-ui` and `@h2-fe/web-ui`.

## Public API

From `src/index.ts`:

- `PdfViewerScreen`: the dumb viewer screen. Props include `document`, `isLoading`, `isError`, `onRetry`, `onOpenAnother`, `onMarksChange`, `extensions` and `retainPageBounds`.
- `usePdfPages(file)`: TanStack Query hook that rasterises a PDF.
- `isPdfPageShape(shape)`: true for the locked page image shapes (`shape:page-N`).
- Types, including `CanvasExtension`, the contract for [canvas extensions](../../../../docs/reference/canvas-extension.md), and `PdfDocumentSummary`.

See the [spec](../../../../docs/specs/task-2-pdf.md) and [ADR 0012](../../../../docs/decisions/0012-pdf-pages-as-image-shapes.md).

From the repo root:

```sh
bunx nx run @h2-fe/pdf-viewer:lint
bunx nx run @h2-fe/pdf-viewer:test
bunx nx run @h2-fe/pdf-viewer:typecheck
bunx nx run @h2-fe/pdf-viewer:build
```
