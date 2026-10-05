# Build a canvas extension

You will build a "Marker" tool: press **M**, click the canvas, and a red dot appears. Undo removes it. You will test it with a Storybook play test.

Along the way you meet the pieces every canvas extension in this repo has: a tool, a factory, UI overrides, and a story.

You should have finished [Annotate your first PDF](first-annotation.md), or at least have `bun install` done and Chromium installed for the play test:

```sh
bunx playwright install chromium
```

This is a throwaway exercise. It lives in a scratch folder inside the pin lib and you delete it at the end. To build a real, shippable one, follow [Add a feature lib](../how-to/add-a-feature-lib.md) afterwards.

## 1. Make the scratch folder

```sh
mkdir libs/web/features/pin/src/lib/tmp-tutorial
```

Files under `src/lib/` are already covered by the pin lib's `typecheck` and `lint`, and Storybook's web stage already globs `libs/web/features/**/src/lib/**/*.stories.tsx`. Nothing to configure.

## 2. Write the tool

Create `libs/web/features/pin/src/lib/tmp-tutorial/marker-extension.ts`:

```ts
import {
  createShapeId,
  StateNode,
  type Editor,
  type TLOnMountHandler,
  type TLStateNodeConstructor,
  type TLUiOverrides
} from "tldraw"

export const MARKER_TOOL_ID = "marker"
export const MARKER_KBD = "m"
export const MARKER_LABEL_KEY = "tool.marker"
export const MARKER_LABEL = "Marker"
export const MARKER_SIZE = 24

class MarkerIdle extends StateNode {
  static override id = "idle"

  override onEnter() {
    this.editor.setCursor({ type: "cross", rotation: 0 })
  }

  override onPointerDown() {
    const { editor } = this
    const point = editor.inputs.getCurrentPagePoint()
    const id = createShapeId()
    editor.markHistoryStoppingPoint(`creating:${id}`)
    editor.run(() => {
      editor.createShape({
        id,
        type: "geo",
        x: point.x - MARKER_SIZE / 2,
        y: point.y - MARKER_SIZE / 2,
        props: { geo: "ellipse", w: MARKER_SIZE, h: MARKER_SIZE, color: "red", fill: "solid" }
      })
      editor.select(id)
    })
    editor.setCurrentTool("select")
  }

  override onCancel() {
    this.editor.setCurrentTool("select")
  }
}

class MarkerTool extends StateNode {
  static override id = MARKER_TOOL_ID
  static override initial = "idle"
  static override children = () => [MarkerIdle]
}

export interface MarkerExtension {
  toolIds: readonly string[]
  tools: readonly TLStateNodeConstructor[]
  overrides: TLUiOverrides
  onMount?: TLOnMountHandler
}

export function createMarkerExtension(): MarkerExtension {
  return {
    toolIds: [MARKER_TOOL_ID],
    tools: [MarkerTool],
    overrides: {
      tools: (editor: Editor, tools) => ({
        ...tools,
        [MARKER_TOOL_ID]: {
          id: MARKER_TOOL_ID,
          label: MARKER_LABEL_KEY,
          icon: "geo-ellipse",
          kbd: MARKER_KBD,
          onSelect: () => editor.setCurrentTool(MARKER_TOOL_ID)
        }
      }),
      translations: { en: { [MARKER_LABEL_KEY]: MARKER_LABEL } }
    }
  }
}
```

What each piece does:

- **`MarkerTool` / `MarkerIdle`** is a tldraw state chart. The tool has one child state. `onPointerDown` creates the shape inside `editor.run` so it is one transaction, after `markHistoryStoppingPoint` so Undo removes the whole dot.
- **`overrides.tools`** registers the tool with tldraw's UI: its id, label key, icon and keyboard shortcut. `kbd: "m"` is what makes **M** work.
- **`overrides.translations`** supplies the label text for that key.
- **`toolIds`** is what the viewer reads to list the tool in its toolbar and shortcuts dialog. Each id must be defined by `overrides.tools`.
- The returned object has the same shape as the viewer's [`CanvasExtension`](../reference/canvas-extension.md). It declares its own interface instead of importing that type, because feature libs do not import each other.

## 3. Write the story

Create `libs/web/features/pin/src/lib/tmp-tutorial/marker.stories.tsx`:

```tsx
import type { Meta, StoryObj } from "@storybook/react-vite"

import { expect, waitFor } from "storybook/test"
import { Tldraw, tleditors, type Editor } from "tldraw"

import { Box } from "@h2-fe/ui"
import "tldraw/tldraw.css"

import { createMarkerExtension, MARKER_SIZE, MARKER_TOOL_ID } from "./marker-extension"

const extension = createMarkerExtension()

const meta = {
  title: "Features/Marker/Tool",
  render: () => (
    <Box position="fixed" inset="0">
      <Tldraw overrides={extension.overrides} tools={extension.tools} />
    </Box>
  )
} satisfies Meta

export default meta
type Story = StoryObj<typeof meta>

async function mountedEditor(canvasElement: HTMLElement): Promise<Editor> {
  let editor: Editor | undefined
  await waitFor(() => {
    editor = tleditors
      .getMounted()
      .find((mounted) => canvasElement.contains(mounted.getContainer()))
    if (!editor) throw new Error("editor not mounted yet")
  })
  if (!editor) throw new Error("no mounted editor")
  return editor
}

export const PlacesAMarker: Story = {
  play: async ({ canvasElement, userEvent }) => {
    const editor = await mountedEditor(canvasElement)
    editor.getContainer().focus()
    await userEvent.keyboard("m")
    await expect(editor.getCurrentToolId()).toBe(MARKER_TOOL_ID)

    const canvas = editor.getContainer().querySelector(".tl-canvas")
    if (!canvas) throw new Error("no tldraw canvas")
    const at = editor.pageToScreen({ x: 200, y: 200 })
    const coords = { clientX: at.x, clientY: at.y }
    await userEvent.pointer([
      { keys: "[MouseLeft>]", target: canvas, coords },
      { keys: "[/MouseLeft]", target: canvas, coords }
    ])

    const shapes = editor.getCurrentPageShapes()
    await expect(shapes).toHaveLength(1)
    const [marker] = shapes
    await expect(marker?.type).toBe("geo")
    await expect(marker?.x).toBeCloseTo(200 - MARKER_SIZE / 2, 0)
    await expect(editor.getCurrentToolId()).toBe("select")

    editor.undo()
    await expect(editor.getCurrentPageShapes()).toHaveLength(0)
  }
}
```

The play function drives the real UI: it presses **M**, clicks the canvas, then asserts on editor state. This is the repo's test style for anything that touches the canvas; see [Write a story with a play test](../how-to/write-a-story-with-a-play-test.md).

## 4. Check it

Type-check and lint the pin lib, which now includes your scratch files:

```sh
bunx nx run @h2-fe/pin:typecheck
bunx nx run @h2-fe/pin:lint
```

Both should pass. Lint may print warnings from the lib's existing files; those are not yours.

Run just your story, headless:

```sh
cd libs/web/ui
bunx vitest run --config vitest.storybook.config.mts -t "Marker"
```

You should see `Tests 1 passed`. This is the same config `test-storybook` uses, filtered by test name. To run every story the way the gate does, use `bunx nx run @h2-fe/web-ui:test-storybook` instead.

To see it by eye, run `bun run storybook:web` and open **Features / Marker / Tool**. Press **M** and click.

## 5. Clean up

Delete the scratch folder:

```sh
rm -r libs/web/features/pin/src/lib/tmp-tutorial
```

## What you learned

- A tool is a tldraw `StateNode` chart plus `overrides.tools` for its UI entry.
- An extension is a plain object returned by a factory. The viewer merges many of them ([reference](../reference/canvas-extension.md)).
- A story with a play function is the component test.

## Next

- Make it real: [Add a feature lib](../how-to/add-a-feature-lib.md), then [Add a canvas extension to the viewer](../how-to/add-a-canvas-extension-to-the-viewer.md).
- Read the real thing: `libs/web/features/pin/src/lib/pin-extension.ts`.
