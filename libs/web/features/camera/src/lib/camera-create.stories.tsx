import type { Meta, StoryObj } from "@storybook/react-vite"

import { expect, userEvent, waitFor, within } from "storybook/test"
import { createShapeId, type TLShapeId } from "tldraw"

import type { CropFrameShape } from "./types"

import { CameraCanvas, cameraStoryMeta } from "./camera-story-canvas"
import { CAMERA_TOOL_ID, CROP_FRAME, FIRST_USE_HINT, FIRST_USE_HINT_STORAGE_KEY } from "./consts"
import {
  INSIDE_BACK,
  OUTSIDE,
  INSIDE_FRONT,
  BACKGROUND,
  FRAME_FROM,
  FRAME_TO,
  FRAME_BOX,
  DOWNLOAD_PNG,
  ACTION_NAMES,
  mountedEditor,
  pointer,
  startDrag,
  drag,
  clickAt,
  cropFrames,
  drawFrame,
  expectBox,
  findMarquee,
  expectVisible,
  findCropToolbar,
  actionNames
} from "./story-helpers"

const meta = {
  title: "Features/Camera/Create",
  ...cameraStoryMeta
} satisfies Meta<typeof CameraCanvas>

export default meta
type Story = StoryObj<typeof meta>

export const ToolbarEntry: Story = {
  play: async ({ canvas, canvasElement }) => {
    const editor = await mountedEditor(canvasElement)

    const button = await canvas.findByRole("button", { name: "Export area — C" })
    await expect(button.querySelector("svg")).not.toBeNull()

    editor.getContainer().focus()
    await userEvent.keyboard("c")
    await waitFor(() => expect(editor.getCurrentToolId()).toBe(CAMERA_TOOL_ID))
  }
}

export const FirstUseHint: Story = {
  play: async ({ canvasElement }) => {
    const editor = await mountedEditor(canvasElement)
    const queryHint = () => within(canvasElement).queryByText(FIRST_USE_HINT)

    editor.setCurrentTool(CAMERA_TOOL_ID)
    const hint = await within(canvasElement).findByText(FIRST_USE_HINT)
    await expectVisible(hint)
    await expect(hint.closest("output")).not.toBeNull()

    editor.getContainer().focus()
    await userEvent.keyboard("{Escape}")
    await waitFor(() => expect(editor.getCurrentToolId()).toBe("select"))
    await waitFor(() => expect(queryHint()).toBeNull())

    editor.setCurrentTool(CAMERA_TOOL_ID)
    await waitFor(() => expect(editor.getCurrentToolId()).toBe(CAMERA_TOOL_ID))
    await expect(queryHint()).toBeNull()

    // A new session: the hint shows again, and a drag hides it.
    editor.setCurrentTool("select")
    sessionStorage.removeItem(FIRST_USE_HINT_STORAGE_KEY)
    editor.setCurrentTool(CAMERA_TOOL_ID)
    await expectVisible(await within(canvasElement).findByText(FIRST_USE_HINT))
    await startDrag(editor, FRAME_FROM, FRAME_TO)
    await waitFor(() => expect(queryHint()).toBeNull())
    pointer(editor, "pointer_up", FRAME_TO)
  }
}

export const DragCreatesFrame: Story = {
  play: async ({ canvasElement }) => {
    const editor = await mountedEditor(canvasElement)

    const frame = await drawFrame(editor)

    await expect(cropFrames(editor)).toHaveLength(1)
    await expectBox({ x: frame.x, y: frame.y, ...frame.props }, FRAME_BOX)
    await expect(editor.getCurrentToolId()).toBe("select")
    await expect(editor.getSelectedShapeIds()).toEqual([frame.id])
    const toolbar = await findCropToolbar(canvasElement)
    await expect(actionNames(toolbar)).toEqual(ACTION_NAMES)
    await expectVisible(toolbar.getByRole("button", { name: DOWNLOAD_PNG }))
  }
}

export const FrameLabel: Story = {
  play: async ({ canvasElement }) => {
    const editor = await mountedEditor(canvasElement)
    const frame = await drawFrame(editor)

    const shape = canvasElement.querySelector<HTMLElement>(`[data-shape-id="${frame.id}"]`)
    if (!shape) throw new Error("The frame is not rendered")
    await expect(shape.querySelector("[data-crop-frame-label]")).toHaveTextContent(
      /^600 × 400 PNG$/
    )
  }
}

export const DragAnyDirection: Story = {
  play: async ({ canvasElement }) => {
    const editor = await mountedEditor(canvasElement)

    const frame = await drawFrame(editor, FRAME_TO, FRAME_FROM)

    await expectBox({ x: frame.x, y: frame.y, ...frame.props }, FRAME_BOX)
  }
}

export const ClickInsideSelects: Story = {
  play: async ({ canvasElement }) => {
    const editor = await mountedEditor(canvasElement)
    // Stands in for the viewer's PDF pages: locked, at the back.
    editor.createShape({
      id: BACKGROUND,
      type: "geo",
      x: 0,
      y: 0,
      props: { w: 800, h: 600, color: "grey" }
    })
    // Reordering skips locked shapes, so lock after sending it back.
    editor.sendToBack([BACKGROUND])
    editor.updateShape({ id: BACKGROUND, type: "geo", isLocked: true })

    const frame = await drawFrame(editor)

    await expect(editor.getCurrentPageShapesSorted().map((shape) => shape.id)).toEqual([
      BACKGROUND,
      frame.id,
      INSIDE_BACK,
      OUTSIDE,
      INSIDE_FRONT
    ])
    editor.selectNone()
    clickAt(editor, { x: 380, y: 120 })
    await waitFor(() => expect(editor.getSelectedShapeIds()).toEqual([frame.id]))
  }
}

export const MarkInsideFrameSelectable: Story = {
  play: async ({ canvasElement }) => {
    const editor = await mountedEditor(canvasElement)
    await drawFrame(editor)
    editor.selectNone()

    clickAt(editor, { x: 310, y: 220 })

    await waitFor(() => expect(editor.getSelectedShapeIds()).toEqual([INSIDE_FRONT]))
  }
}

export const NeverRotates: Story = {
  play: async ({ canvasElement }) => {
    const editor = await mountedEditor(canvasElement)
    const frame = await drawFrame(editor)

    editor.rotateShapesBy([frame.id], Math.PI / 6)

    const rotated = editor.getShape(frame.id)
    await expect(rotated?.rotation).toBe(0)
    await expect(rotated?.x).toBe(frame.x)
    await expect(rotated?.y).toBe(frame.y)
  }
}

/** The computed colour of a design token, resolved where `host` sits (colour mode included). */
function tokenColor(host: Element, token: string): string {
  const probe = document.createElement("span")
  probe.style.color = `var(--chakra-colors-${token})`
  host.append(probe)
  const color = getComputedStyle(probe).color
  probe.remove()
  return color
}

export const LabelVisibility: Story = {
  play: async ({ canvasElement }) => {
    const editor = await mountedEditor(canvasElement)
    const wide = await drawFrame(editor)
    const zoom = editor.getZoomLevel()
    const narrow = createShapeId("narrow-frame")
    editor.createShape<CropFrameShape>({
      id: narrow,
      type: CROP_FRAME,
      x: 600,
      y: 100,
      props: { w: 30 / zoom, h: 200 / zoom }
    })
    editor.selectNone()
    const parts = (id: TLShapeId) => {
      const shape = canvasElement.querySelector(`[data-shape-id="${id}"]`)
      const label = shape?.querySelector<HTMLElement>("[data-crop-frame-label]")
      const corners = shape?.querySelector("[data-crop-corners]")
      const text = label?.firstElementChild
      if (!label || !corners || !text) throw new Error(`Frame ${id} is missing its chrome`)
      return { label, corners, text }
    }

    await waitFor(() => expect(parts(wide.id).label).toBeVisible())
    await expect(parts(wide.id).corners).toBeVisible()
    await waitFor(() => expect(parts(narrow).label).not.toBeVisible())

    editor.setHoveredShape(narrow)
    await waitFor(() => expect(parts(narrow).label).toBeVisible())
    editor.setHoveredShape(null)
    await waitFor(() => expect(parts(narrow).label).not.toBeVisible())

    editor.select(narrow)
    await waitFor(() => expect(parts(narrow).label).toBeVisible())
    await expect(parts(narrow).corners).not.toBeVisible()
    const { label, text } = parts(narrow)
    await expect(getComputedStyle(text).backgroundColor).toBe(tokenColor(label, "fg"))
    await expect(getComputedStyle(text).color).toBe(tokenColor(label, "bg"))
  }
}

export const StylePanelHidden: Story = {
  play: async ({ canvasElement }) => {
    const editor = await mountedEditor(canvasElement)
    const frame = await drawFrame(editor)
    const stylePanel = () => canvasElement.querySelector<HTMLElement>('[data-testid="style.panel"]')
    const expectPanelShown = (isShown: boolean) =>
      waitFor(async () => {
        const panel = stylePanel()
        if (isShown) await expect(panel).toBeVisible()
        else if (panel) await expect(panel).not.toBeVisible()
      })

    await expectPanelShown(false)

    editor.select(INSIDE_BACK)
    await expectPanelShown(true)

    editor.select(frame.id, INSIDE_BACK)
    await expectPanelShown(true)

    editor.select(frame.id)
    await expectPanelShown(false)
  }
}

export const MarqueeWhileDragging: Story = {
  play: async ({ canvasElement }) => {
    const editor = await mountedEditor(canvasElement)
    editor.setCurrentTool(CAMERA_TOOL_ID)

    await startDrag(editor, FRAME_FROM, FRAME_TO)

    const marquee = await waitFor(() => {
      const element = findMarquee(canvasElement)
      if (!element) throw new Error("No marquee is drawn")
      return element
    })
    await expectVisible(within(marquee).getByText("600 × 400"))
    await expect(marquee.querySelector("[data-crop-corners]")).not.toBeNull()
    const topLeft = editor.pageToScreen(FRAME_FROM)
    const { x, y, width, height } = marquee.getBoundingClientRect()
    await expectBox({ x, y, w: width, h: height }, { x: topLeft.x, y: topLeft.y, w: 300, h: 200 })
    await expect(cropFrames(editor)).toHaveLength(0)
    pointer(editor, "pointer_up", FRAME_TO)
  }
}

export const EscapeCancels: Story = {
  play: async ({ canvasElement }) => {
    const editor = await mountedEditor(canvasElement)
    editor.setCurrentTool(CAMERA_TOOL_ID)
    await startDrag(editor, FRAME_FROM, FRAME_TO)
    await waitFor(() => expect(editor.isIn("camera.dragging")).toBe(true))

    editor.getContainer().focus()
    await userEvent.keyboard("{Escape}")

    await waitFor(() => expect(editor.isIn("camera.dragging")).toBe(false))
    await expect(editor.getCurrentToolId()).toBe(CAMERA_TOOL_ID)
    await waitFor(() => expect(findMarquee(canvasElement)).toBeNull())
    pointer(editor, "pointer_up", FRAME_TO)
    await expect(cropFrames(editor)).toHaveLength(0)
  }
}

export const KeyboardCreatesFrame: Story = {
  play: async ({ canvasElement }) => {
    const editor = await mountedEditor(canvasElement)
    const expectCentredFrame = async () => {
      const frame = await waitFor(() => {
        const [only, ...rest] = cropFrames(editor)
        if (!only || rest.length > 0) throw new Error("Expected exactly one crop frame")
        return only
      })
      const { center } = editor.getViewportPageBounds()
      await expectBox(editor.getShapePageBounds(frame), {
        x: center.x - 150,
        y: center.y - 100,
        w: 300,
        h: 200
      })
      await expect(editor.getSelectedShapeIds()).toEqual([frame.id])
      await expect(editor.getCurrentToolId()).toBe("select")
      return frame
    }
    await expect(editor.getZoomLevel()).toBe(1)

    editor.getContainer().focus()
    await userEvent.keyboard("c")
    await waitFor(() => expect(editor.getCurrentToolId()).toBe(CAMERA_TOOL_ID))
    await userEvent.keyboard("{Enter}")
    const first = await expectCentredFrame()

    editor.deleteShapes([first.id])
    await userEvent.keyboard("c")
    await waitFor(() => expect(editor.getCurrentToolId()).toBe(CAMERA_TOOL_ID))
    await userEvent.keyboard("c")
    await expectCentredFrame()
  }
}

export const ClickCreatesNothing: Story = {
  play: async ({ canvasElement }) => {
    const editor = await mountedEditor(canvasElement)
    editor.setCurrentTool(CAMERA_TOOL_ID)

    pointer(editor, "pointer_down", FRAME_FROM)
    pointer(editor, "pointer_up", FRAME_FROM)
    await drag(editor, FRAME_FROM, { x: FRAME_FROM.x + 12, y: FRAME_FROM.y + 12 })

    await expect(cropFrames(editor)).toHaveLength(0)
    await expect(editor.getCurrentToolId()).toBe(CAMERA_TOOL_ID)
  }
}
