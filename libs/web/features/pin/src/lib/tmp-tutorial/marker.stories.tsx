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
