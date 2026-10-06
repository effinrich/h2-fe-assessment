import type { Meta, StoryObj } from "@storybook/react-vite"

import { expect, spyOn, userEvent, waitFor, within } from "storybook/test"
import { createShapeId, react, type BoxModel } from "tldraw"

import type { CropFrameShape } from "../types"

import { getCropFrameBounds } from "../camera"
import { CameraDragging } from "../classes"
import { CAMERA_TOOL_ID, CROP_FRAME } from "../consts"
import { getCropExportPlan } from "../crop-export/crop-export"
import { CameraCanvas, cameraStoryMeta } from "./camera-story-canvas"
import {
  OUTSIDE,
  FRAME_BOX,
  DOWNLOAD_PNG,
  mountedEditor,
  startDrag,
  cropFrames,
  drawFrame,
  expectBox,
  findMarquee,
  findCropToolbar,
  spyOnDownloads
} from "./story-helpers"

const meta = {
  title: "Features/Camera/Canvas",
  ...cameraStoryMeta
} satisfies Meta<typeof CameraCanvas>

export default meta
type Story = StoryObj<typeof meta>

export const UndoCreation: Story = {
  play: async ({ canvasElement }) => {
    const editor = await mountedEditor(canvasElement)
    const frame = await drawFrame(editor)

    editor.undo()
    await expect(cropFrames(editor)).toHaveLength(0)
    editor.redo()
    await expect(cropFrames(editor).map((shape) => shape.id)).toEqual([frame.id])

    editor.select(frame.id)
    const toolbar = await findCropToolbar(canvasElement)
    const click = spyOnDownloads()
    const canUndo = editor.getCanUndo()
    const canRedo = editor.getCanRedo()
    await userEvent.click(toolbar.getByRole("button", { name: DOWNLOAD_PNG }))
    await waitFor(() => expect(click).toHaveBeenCalledTimes(1))
    await expect(editor.getCanUndo()).toBe(canUndo)
    await expect(editor.getCanRedo()).toBe(canRedo)
  }
}

export const CropFrameBoundsAreReactive: Story = {
  play: async ({ canvasElement }) => {
    const editor = await mountedEditor(canvasElement)
    const seen: BoxModel[][] = []
    const stop = react("crop frame bounds", () => {
      seen.push(getCropFrameBounds(editor))
    })

    const frame = await drawFrame(editor)
    await waitFor(() => expectBox(seen.at(-1)?.[0], FRAME_BOX))
    editor.updateShape<CropFrameShape>({ id: frame.id, type: CROP_FRAME, x: 150 })
    await waitFor(() => expectBox(seen.at(-1)?.[0], { ...FRAME_BOX, x: 150 }))
    editor.deleteShape(frame.id)
    await waitFor(() => expect(seen.at(-1)).toEqual([]))
    stop()
  }
}

export const CropFrameBoundsIgnoreUnrelatedChanges: Story = {
  play: async ({ canvasElement }) => {
    const editor = await mountedEditor(canvasElement)
    const frame = await drawFrame(editor)
    let runs = 0
    const stop = react("crop frame bounds", () => {
      getCropFrameBounds(editor)
      runs += 1
    })
    const initialRuns = runs

    editor.updateShape({ id: OUTSIDE, type: "geo", x: 640 })
    await expect(runs).toBe(initialRuns)

    editor.updateShape<CropFrameShape>({ id: frame.id, type: CROP_FRAME, x: 150 })
    await expect(runs).toBe(initialRuns + 1)
    stop()
  }
}

export const ReadonlyHidesTool: Story = {
  args: { readonly: true },
  play: async ({ canvas, canvasElement }) => {
    const editor = await mountedEditor(canvasElement)
    await waitFor(() => expect(editor.getIsReadonly()).toBe(true))

    await expect(canvas.queryByRole("button", { name: /^Export area/ })).toBeNull()
    const toolbar = await findCropToolbar(canvasElement)
    const click = spyOnDownloads()
    await userEvent.click(toolbar.getByRole("button", { name: DOWNLOAD_PNG }))
    await waitFor(() => expect(click).toHaveBeenCalledTimes(1))
  }
}

export const FollowsCanvasColorMode: Story = {
  args: { colorScheme: "dark" },
  play: async ({ canvasElement }) => {
    const editor = await mountedEditor(canvasElement)
    await expect(editor.getColorMode()).toBe("dark")
    const frame = await drawFrame(editor)

    const toolbar = await within(canvasElement).findByRole("toolbar", { name: "Crop frame" })
    await expect(toolbar.closest('[data-testid="contextual-toolbar"]')).toHaveClass("dark")
    const shape = canvasElement.querySelector(`[data-shape-id="${frame.id}"]`)
    await expect(shape?.querySelector(".dark")).not.toBeNull()

    editor.selectNone()
    await waitFor(async () => {
      const corners = canvasElement.querySelector(
        `[data-shape-id="${frame.id}"] [data-crop-corners]`
      )
      await expect(corners).toHaveAttribute("data-corner-token", "fg")
    })

    const toImage = spyOn(editor, "toImage")
    editor.select(frame.id)
    const actions = await findCropToolbar(canvasElement)
    await userEvent.click(actions.getByRole("button", { name: DOWNLOAD_PNG }))
    await waitFor(() => expect(toImage).toHaveBeenCalled())
    await expect(toImage.mock.lastCall?.[1]?.darkMode).toBe(false)
  }
}

export const EdgeScrollWhileDragging: Story = {
  play: async ({ canvasElement }) => {
    const editor = await mountedEditor(canvasElement)
    editor.user.updateUserPreferences({ edgeScrollSpeed: 1 })
    editor.setCurrentTool(CAMERA_TOOL_ID)
    const box = editor.getContainer().getBoundingClientRect()
    const page = editor.screenToPage({ x: box.right - 4, y: box.top + box.height / 2 })
    await startDrag(editor, page, page)
    const dragging = editor.getStateDescendant<CameraDragging>(`${CAMERA_TOOL_ID}.dragging`)
    if (!dragging) throw new Error("camera is not dragging")
    const scroll = spyOn(editor.edgeScrollManager, "updateEdgeScrolling")
    const before = editor.getCamera()
    dragging.onTick?.({ elapsed: 400 })
    dragging.onTick?.({ elapsed: 400 })
    await expect(scroll).toHaveBeenCalledWith(400)
    const after = editor.getCamera()
    await expect(after.x !== before.x || after.y !== before.y).toBe(true)
    await expect(findMarquee(canvasElement)).not.toBeNull()
  }
}

export const ClippedChildExcluded: Story = {
  play: async ({ canvasElement }) => {
    const editor = await mountedEditor(canvasElement)
    const parent = createShapeId("clip-parent")
    const child = createShapeId("clipped-child")
    editor.createShape({ id: parent, type: "frame", x: 500, y: 100, props: { w: 80, h: 80 } })
    editor.createShape({
      id: child,
      type: "geo",
      x: 0,
      y: 0,
      parentId: parent,
      props: { w: 200, h: 200, fill: "solid" }
    })
    const crop = await drawFrame(editor, { x: 590, y: 100 }, { x: 690, y: 200 })
    const plan = getCropExportPlan(editor, crop.id)
    await expect(plan?.ids).not.toContain(child)
  }
}

export const LocalisedAnnouncement: Story = {
  args: { locale: "fr" },
  play: async ({ canvasElement }) => {
    const editor = await mountedEditor(canvasElement)
    await drawFrame(editor)
    await waitFor(() =>
      expect(within(canvasElement).getByRole("status", { name: "Status" })).toHaveTextContent(
        /Crop frame/
      )
    )
    await expect(
      within(canvasElement).getByRole("status", { name: "Status" })
    ).not.toHaveTextContent("tool.crop-frame")
  }
}

const PAGE_ONE = createShapeId("page-1")

export const ExportIncludesPageShape: Story = {
  play: async ({ canvasElement }) => {
    const editor = await mountedEditor(canvasElement)
    editor.createShape({
      id: PAGE_ONE,
      type: "geo",
      x: 80,
      y: 80,
      isLocked: true,
      props: { w: 400, h: 300, fill: "solid", color: "grey" }
    })
    const crop = await drawFrame(editor)
    const plan = getCropExportPlan(editor, crop.id)
    await expect(plan?.ids).toContain(PAGE_ONE)
    await expect(PAGE_ONE).toBe("shape:page-1")
  }
}

export const RetainedPageStillExports: Story = {
  play: async ({ canvasElement }) => {
    const editor = await mountedEditor(canvasElement)
    editor.createShape({
      id: PAGE_ONE,
      type: "geo",
      x: 80,
      y: 80,
      isLocked: true,
      props: { w: 400, h: 300, fill: "solid", color: "grey" }
    })
    const crop = await drawFrame(editor)
    const viewport = editor.getViewportPageBounds()
    editor.setCamera({ x: viewport.x - viewport.w * 2, y: viewport.y, z: editor.getZoomLevel() })
    await expect(editor.getShape(PAGE_ONE)).toBeDefined()
    const plan = getCropExportPlan(editor, crop.id)
    await expect(plan?.ids).toContain(PAGE_ONE)
  }
}
