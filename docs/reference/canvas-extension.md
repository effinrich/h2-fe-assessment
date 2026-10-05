# `CanvasExtension`

The contract between a canvas feature (pin, camera) and the viewer that hosts it. Defined in `libs/web/features/pdf-viewer/src/lib/types.ts` and exported from `@h2-fe/pdf-viewer`.

Extension libs do not import this type. Each declares a structurally compatible interface and the viewer route checks the match (see [Add a canvas extension to the viewer](../how-to/add-a-canvas-extension-to-the-viewer.md)).

## Fields

All fields are optional.

| Field                | Type                                     | Purpose                                                                                       |
| -------------------- | ---------------------------------------- | --------------------------------------------------------------------------------------------- |
| `toolIds`            | `readonly string[]`                      | Tools to list in the toolbar and shortcuts dialog. Each must be defined by `overrides.tools`. |
| `shapeUtils`         | `readonly TLAnyShapeUtilConstructor[]`   | Custom shape types.                                                                           |
| `bindingUtils`       | `readonly TLAnyBindingUtilConstructor[]` | Custom bindings between shapes.                                                               |
| `tools`              | `readonly TLStateNodeConstructor[]`      | Tool state charts.                                                                            |
| `overlayUtils`       | `readonly TLAnyOverlayUtilConstructor[]` | Canvas overlays.                                                                              |
| `overrides`          | `TLUiOverrides`                          | UI registration: `tools`, `translations`, and so on.                                          |
| `InFrontOfTheCanvas` | `ComponentType`                          | A React component rendered over the canvas, for example a first-use hint.                     |
| `onMount`            | `TLOnMountHandler`                       | Runs once the editor exists. May return a teardown function.                                  |

## How the viewer merges extensions

`mergeCanvasExtensions` (`pdf-viewer/src/lib/utils.ts`) combines the route's array in order:

- `toolIds`, `shapeUtils`, `bindingUtils`, `tools`, `overlayUtils`: concatenated. Array order is toolbar order.
- `overrides`: collected into an array, followed by the viewer's own `VIEWER_OVERRIDES` (the "Document tools" label). tldraw applies the array.
- `InFrontOfTheCanvas`: each component is rendered.
- `onMount`: each handler runs on mount; all returned teardowns run on unmount.

`PdfViewerScreen` passes the merged result to a single `<Tldraw>`. One toolbar and one shortcuts dialog are built from `toolIds`. If no extension supplies `toolIds`, tldraw keeps its stock toolbar and dialog.

## Requirements on an extension

- **Create it once.** Module scope or `useMemo`. tldraw expects stable arrays.
- **Every `toolIds` entry needs an `overrides.tools` entry** with `id`, `label` (a translation key), `icon`, `kbd` and `onSelect`.
- **Add a translation** under `overrides.translations.en` for each label key.
- **Do not import sibling feature libs** or `@h2-fe/pdf-viewer`.
- Pass anything that needs viewer knowledge in through factory options (pin takes `canAttach`).

## Related props on `PdfViewerScreen`

| Prop               | Purpose                                                                                                         |
| ------------------ | --------------------------------------------------------------------------------------------------------------- |
| `extensions`       | The `CanvasExtension[]` above.                                                                                  |
| `retainPageBounds` | `(editor) => BoxModel[]` in page space. Pages under these boxes stay rendered when off screen. Read reactively. |
| `onMarksChange`    | Called with whether the canvas holds any user marks. The route uses it for the leave-document warning.          |

## Existing extensions

| Factory                           | Lib             | Tool id  | Options                                   |
| --------------------------------- | --------------- | -------- | ----------------------------------------- |
| `createPinExtension(options?)`    | `@h2-fe/pin`    | `pin`    | `canAttach(shape) => boolean`             |
| `createCameraExtension(options?)` | `@h2-fe/camera` | `camera` | `documentName` (used in export filenames) |

Tool ids are exported as `PIN_TOOL_ID` and `CAMERA_TOOL_ID`. Shortcuts: **P** for pin, **C** for camera.
