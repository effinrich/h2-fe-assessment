# Add a canvas extension to the viewer

You have a feature lib that exports a factory such as `createMarkerExtension()` (see the [tutorial](../tutorials/build-a-canvas-extension.md)). This wires it into the viewer.

## 1. Export the factory

In the lib's `src/index.ts`, export the factory and its types:

```ts
export { createMarkerExtension } from "./lib/marker-extension"
export type { MarkerExtension } from "./lib/types"
```

Define the return type as a local interface. Do not import `CanvasExtension` from `@h2-fe/pdf-viewer`: feature libs do not import each other. TypeScript checks the structural match in step 2.

Every `toolIds` entry must have a matching tool in `overrides.tools`. Give the tool a `kbd`, a `label` key with a `translations.en` entry, and an `icon`.

## 2. Compose it in the route

Edit `apps/web/src/app/routes/pdf-viewer-route.tsx`. Create the extension once, at module scope or in `useMemo`; tldraw expects stable tool and util arrays.

```tsx
import { createMarkerExtension } from "@h2-fe/marker"

const markerExtension = createMarkerExtension()
```

Add it to the memoised array. Order is toolbar order:

```tsx
const extensions = useMemo<readonly CanvasExtension[]>(
  () => [pinExtension, createCameraExtension({ documentName }), markerExtension],
  [documentName]
)
```

The array's type, `readonly CanvasExtension[]`, is where a mismatch becomes a compile error.

If your extension needs viewer knowledge, pass it in from here, like pin's `canAttach: (shape) => !isPdfPageShape(shape)`. The lib stays ignorant of the viewer.

If shapes of yours must stay rendered while off screen, the route also passes `retainPageBounds` to `PdfViewerScreen`; camera does this with `getCropFrameBounds`.

## 3. Cover it

Add to `apps/web/src/app/routes/pdf-viewer-route.spec.tsx` if the route now passes something new, like a callback. The extension's own behaviour belongs in its stories, mounted on a plain `<Tldraw>`.

## 4. Check by hand

```sh
bun run start
```

Open the example, press your shortcut, use the tool. Your tool should appear in the toolbar and in the shortcuts dialog.

## 5. Gate

```sh
bun run gate
```

## Notes

- Nx infers the new edge from the import. Do not add the lib to `apps/web/package.json`.
- `PdfViewerScreen` merges extensions: arrays are concatenated, overrides are applied in order, `onMount` handlers are composed. Details in the [`CanvasExtension` reference](../reference/canvas-extension.md).
- Do not cover tldraw's own Menu, undo, redo, delete or style panel with new UI. Customise them instead.
