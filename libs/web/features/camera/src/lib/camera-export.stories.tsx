import type { Meta, StoryObj } from "@storybook/react-vite"

import { expect, screen, spyOn, userEvent, waitFor, within } from "storybook/test"
import { createShapeId, type Editor, type TLShapeId } from "tldraw"

import type { CropFrameShape } from "./types"

import { CameraCanvas, cameraStoryMeta } from "./camera-story-canvas"
import { CROP_FRAME } from "./consts"
import {
  INSIDE_BACK,
  INSIDE_FRONT,
  FRAME_BOX,
  DOWNLOAD_NAME,
  DOWNLOAD_PNG,
  COPY_IMAGE,
  DOWNLOAD_SVG,
  mountedEditor,
  drawFrame,
  expectBox,
  expectVisible,
  findCropToolbar,
  findToast,
  spyOnDownloads,
  downloadNames
} from "./story-helpers"

const meta = {
  title: "Features/Camera/Export",
  ...cameraStoryMeta
} satisfies Meta<typeof CameraCanvas>

export default meta
type Story = StoryObj<typeof meta>

export const DownloadPng: Story = {
  play: async ({ canvasElement }) => {
    const editor = await mountedEditor(canvasElement)
    const frame = await drawFrame(editor)
    const toolbar = await findCropToolbar(canvasElement)
    const toImage = spyOn(editor, "toImage")
    const click = spyOnDownloads()

    await userEvent.click(toolbar.getByRole("button", { name: DOWNLOAD_PNG }))

    await waitFor(() => expect(click).toHaveBeenCalledTimes(1))
    await expect(toImage).toHaveBeenCalledTimes(1)
    await expect(toImage).toHaveBeenCalledWith(
      [INSIDE_BACK, INSIDE_FRONT],
      expect.objectContaining({
        padding: 0,
        background: true,
        darkMode: false,
        pixelRatio: 2,
        format: "png"
      })
    )
    await expectBox(toImage.mock.lastCall?.[1]?.bounds, FRAME_BOX)
    const [name = ""] = downloadNames(click)
    await expect(name).toMatch(DOWNLOAD_NAME)
    const toast = await findToast("Image downloaded")
    await expect(toast).toHaveAttribute("data-type", "success")
    await expect(toast).toHaveTextContent(name)
    await expect(editor.getShape(frame.id)).toBeDefined()
    await expect(editor.getSelectedShapeIds()).toEqual([frame.id])
  }
}

export const ExportSizeIsTwoX: Story = {
  play: async ({ canvasElement }) => {
    const editor = await mountedEditor(canvasElement)
    await drawFrame(editor)
    const toolbar = await findCropToolbar(canvasElement)
    const toImage = editor.toImage.bind(editor)
    const exports: ReturnType<Editor["toImage"]>[] = []
    spyOn(editor, "toImage").mockImplementation((shapes, opts) => {
      const result = toImage(shapes, opts)
      exports.push(result)
      return result
    })
    spyOnDownloads()

    await userEvent.click(toolbar.getByRole("button", { name: DOWNLOAD_PNG }))

    await waitFor(() => expect(exports).toHaveLength(1))
    const [exported] = exports
    if (!exported) throw new Error("No export was started")
    // toImage reports logical size; the PNG's pixels are what the user gets.
    const bitmap = await createImageBitmap((await exported).blob)
    await expect([bitmap.width, bitmap.height]).toEqual([600, 400])
  }
}

export const ReExport: Story = {
  play: async ({ canvasElement }) => {
    const editor = await mountedEditor(canvasElement)
    const frame = await drawFrame(editor)
    const toolbar = await findCropToolbar(canvasElement)
    const click = spyOnDownloads()
    const documentChanges: unknown[] = []
    const stopListening = editor.store.listen((entry) => documentChanges.push(entry), {
      scope: "document"
    })

    const download = toolbar.getByRole("button", { name: DOWNLOAD_PNG })
    await userEvent.click(download)
    await waitFor(() => expect(click).toHaveBeenCalledTimes(1))
    await waitFor(() => expect(download).not.toHaveAttribute("aria-busy"))
    await userEvent.click(download)
    await waitFor(() => expect(click).toHaveBeenCalledTimes(2))
    stopListening()

    await expect(editor.getShape(frame.id)).toBeDefined()
    await expect(documentChanges).toHaveLength(0)
  }
}

export const CopyImage: Story = {
  play: async ({ canvasElement }) => {
    const editor = await mountedEditor(canvasElement)
    await drawFrame(editor)
    const toolbar = await findCropToolbar(canvasElement)
    // Like a real clipboard, wait for the image before resolving.
    const write = spyOn(navigator.clipboard, "write").mockImplementation(async ([item]) => {
      await item?.getType("image/png")
    })

    await userEvent.click(toolbar.getByRole("button", { name: COPY_IMAGE }))

    await expectVisible(await screen.findByText("Copied image"))
    await expect(write).toHaveBeenCalledTimes(1)
    const [item] = write.mock.lastCall?.[0] ?? []
    await expect(item).toBeInstanceOf(ClipboardItem)
    await expect(item?.types).toContain("image/png")
  }
}

export const CopyUnsupported: Story = {
  beforeEach() {
    Object.defineProperty(navigator, "clipboard", { configurable: true, value: undefined })
    return () => {
      Reflect.deleteProperty(navigator, "clipboard")
    }
  },
  play: async ({ canvasElement }) => {
    const editor = await mountedEditor(canvasElement)
    const frame = await drawFrame(editor)
    const toolbar = await findCropToolbar(canvasElement)
    const click = spyOnDownloads()

    await userEvent.click(toolbar.getByRole("button", { name: COPY_IMAGE }))

    const toast = await findToast("Copying images isn't supported here")
    await expect(toast).toHaveAttribute("data-type", "error")
    await expect(editor.getShape(frame.id)).toBeDefined()
    await expect(editor.getSelectedShapeIds()).toEqual([frame.id])

    await userEvent.click(within(toast).getByRole("button", { name: "Download PNG" }))
    await waitFor(() => expect(click).toHaveBeenCalledTimes(1))
    await expect(downloadNames(click)[0]).toMatch(DOWNLOAD_NAME)
  }
}

export const CopyFails: Story = {
  play: async ({ canvasElement }) => {
    const editor = await mountedEditor(canvasElement)
    const frame = await drawFrame(editor)
    const toolbar = await findCropToolbar(canvasElement)
    spyOn(navigator.clipboard, "write").mockRejectedValue(
      new DOMException("Write permission denied.", "NotAllowedError")
    )
    const click = spyOnDownloads()

    await userEvent.click(toolbar.getByRole("button", { name: COPY_IMAGE }))

    const toast = await findToast("Couldn't copy the image")
    await expect(toast).toHaveAttribute("data-type", "error")
    await expect(toast).toHaveTextContent("The browser blocked clipboard access.")
    await expect(editor.getSelectedShapeIds()).toEqual([frame.id])

    await userEvent.click(within(toast).getByRole("button", { name: "Download PNG" }))
    await waitFor(() => expect(click).toHaveBeenCalledTimes(1))
    await expect(downloadNames(click)[0]).toMatch(DOWNLOAD_NAME)
  }
}

export const DownloadSvg: Story = {
  play: async ({ canvasElement }) => {
    const editor = await mountedEditor(canvasElement)
    await drawFrame(editor)
    const toolbar = await findCropToolbar(canvasElement)
    const toImage = spyOn(editor, "toImage")
    const click = spyOnDownloads()

    await userEvent.click(toolbar.getByRole("button", { name: DOWNLOAD_SVG }))

    await waitFor(() => expect(click).toHaveBeenCalledTimes(1))
    await expect(downloadNames(click)[0]).toMatch(/^q3-report-crop-\d{8}-\d{6}\.svg$/)
    await expect(toImage).toHaveBeenCalledWith(
      [INSIDE_BACK, INSIDE_FRONT],
      expect.objectContaining({ format: "svg", padding: 0, background: true })
    )
    await expect(toImage.mock.lastCall?.[1]?.pixelRatio).toBeUndefined()
  }
}

export const FrameNeverInExport: Story = {
  play: async ({ canvasElement }) => {
    const editor = await mountedEditor(canvasElement)
    const frame = await drawFrame(editor)
    const overlapping = createShapeId("overlapping-frame")
    editor.createShape<CropFrameShape>({
      id: overlapping,
      type: CROP_FRAME,
      x: 250,
      y: 150,
      props: { w: 300, h: 200 }
    })
    editor.select(frame.id)
    const toolbar = await findCropToolbar(canvasElement)
    const toImage = spyOn(editor, "toImage")
    const click = spyOnDownloads()

    await userEvent.click(toolbar.getByRole("button", { name: DOWNLOAD_PNG }))

    await waitFor(() => expect(click).toHaveBeenCalledTimes(1))
    await expect(toImage.mock.lastCall?.[0]).toEqual([INSIDE_BACK, INSIDE_FRONT])

    // tldraw draws nothing for a frame (its bounds are handled by the actions).
    const drawing = async (ids: TLShapeId[]) => {
      const result = await editor.getSvgString(ids, { background: false })
      return new DOMParser().parseFromString(result?.svg ?? "<svg/>", "image/svg+xml")
        .documentElement.innerHTML
    }
    const alone = await drawing([INSIDE_BACK])
    await expect(alone).toContain("<path")
    // Without `toSvg`, tldraw would draw the frame's HTML component instead.
    const component = spyOn(editor.getShapeUtil(CROP_FRAME), "component")
    await expect(await drawing([INSIDE_BACK, frame.id, overlapping])).toBe(alone)
    await expect(component).not.toHaveBeenCalled()

    // tldraw's own Copy as PNG leaves the frames out, so they don't grow the bounds.
    spyOn(navigator.clipboard, "write").mockResolvedValue()
    editor.select(INSIDE_BACK, frame.id, overlapping)
    editor.getContainer().focus()
    await userEvent.keyboard("{Control>}{Shift>}c{/Shift}{/Control}")
    await waitFor(() => expect(toImage).toHaveBeenCalledTimes(2))
    await expect(toImage.mock.lastCall?.[0]).toEqual([INSIDE_BACK])
  }
}
