import type { Meta, StoryObj } from "@storybook/react-vite"

import { expect, screen, spyOn, userEvent, waitFor, within } from "storybook/test"
import { createShapeId } from "tldraw"

import { toaster } from "@h2-fe/ui"

import type { CropFrameShape } from "./types"

import { CameraCanvas, cameraStoryMeta } from "./camera-story-canvas"
import { CROP_FRAME } from "./consts"
import {
  FRAME_TO,
  DOWNLOAD_NAME,
  MOD_KEY,
  DOWNLOAD_PNG,
  COPY_IMAGE,
  DOWNLOAD_SVG,
  ACTION_NAMES,
  mountedEditor,
  drag,
  drawFrame,
  expectBox,
  expectVisible,
  findCropToolbarElement,
  findCropToolbar,
  actionNames,
  actionsDisabled,
  findToast,
  spyOnDownloads,
  downloadNames
} from "./story-helpers"

const meta = {
  title: "Features/Camera/Toolbar",
  ...cameraStoryMeta
} satisfies Meta<typeof CameraCanvas>

export default meta
type Story = StoryObj<typeof meta>

export const ToolbarFlipsBelow: Story = {
  play: async ({ canvasElement }) => {
    const editor = await mountedEditor(canvasElement)
    const frame = await drawFrame(editor)
    await findCropToolbar(canvasElement)
    const toolbar = (await findCropToolbarElement(canvasElement)).closest<HTMLElement>(
      '[data-testid="contextual-toolbar"]'
    )
    const shape = canvasElement.querySelector<HTMLElement>(`[data-shape-id="${frame.id}"]`)
    if (!toolbar || !shape) throw new Error("The frame or its toolbar is missing")
    const label = within(shape).getByText(/^600 × 400/)
    const frameScreenBounds = () => {
      const bounds = editor.getSelectionScreenBounds()
      if (!bounds) throw new Error("Nothing is selected")
      return bounds
    }

    await waitFor(() =>
      expect(toolbar.getBoundingClientRect().bottom).toBeLessThanOrEqual(frameScreenBounds().y)
    )

    const viewportTop = editor.getViewportScreenBounds().y
    const pageY = editor.screenToPage({ x: 0, y: viewportTop + 10 }).y
    editor.updateShape<CropFrameShape>({ id: frame.id, type: CROP_FRAME, y: pageY })

    // tldraw rounds the toolbar's position to whole pixels.
    await waitFor(() =>
      expect(toolbar.getBoundingClientRect().top).toBeGreaterThanOrEqual(
        label.getBoundingClientRect().bottom - 1
      )
    )
    await expect(label.getBoundingClientRect().top).toBeGreaterThanOrEqual(frameScreenBounds().maxY)
  }
}

export const EmptyFrameDisabled: Story = {
  play: async ({ canvasElement }) => {
    const editor = await mountedEditor(canvasElement)
    await drawFrame(editor, { x: 20, y: 420 }, { x: 220, y: 560 })
    const toolbar = await findCropToolbar(canvasElement)
    const toImage = spyOn(editor, "toImage")

    await expectVisible(toolbar.getByText("Nothing inside"))
    await expect(actionsDisabled(toolbar)).toEqual([true, true, true])
    await Promise.all(
      toolbar
        .getAllByRole("button")
        .map((button) => expect(button).toHaveAccessibleDescription("Nothing inside"))
    )
    await userEvent.click(toolbar.getByRole("button", { name: DOWNLOAD_PNG }))
    await expect(toImage).not.toHaveBeenCalled()
  }
}

export const ResizeThenExport: Story = {
  play: async ({ canvasElement }) => {
    const editor = await mountedEditor(canvasElement)
    const frame = await drawFrame(editor)
    const overlayIds = editor.overlays.getCurrentOverlays().map((overlay) => overlay.id)
    // Positive control: the selection's handles are overlays, so "no rotate
    // handle" means something.
    await expect(overlayIds).toContain("selection_fg:bottom_right")
    await expect(overlayIds.filter((id) => id.includes("rotate"))).toHaveLength(0)

    await drag(editor, FRAME_TO, { x: 450, y: 350 })

    const resized = { x: 100, y: 100, w: 350, h: 250 }
    await waitFor(() => expectBox(editor.getShapePageBounds(frame.id), resized))
    const toolbar = await findCropToolbar(canvasElement)
    const toImage = spyOn(editor, "toImage")
    const click = spyOnDownloads()
    await userEvent.click(toolbar.getByRole("button", { name: DOWNLOAD_PNG }))
    await waitFor(() => expect(click).toHaveBeenCalledTimes(1))
    await expectBox(toImage.mock.lastCall?.[1]?.bounds, resized)
  }
}

export const ExportBusy: Story = {
  play: async ({ canvasElement }) => {
    const editor = await mountedEditor(canvasElement)
    await drawFrame(editor)
    const toolbar = await findCropToolbar(canvasElement)
    const toImage = editor.toImage.bind(editor)
    let release: (() => void) | undefined
    const held = new Promise<void>((resolve) => {
      release = resolve
    })
    const spy = spyOn(editor, "toImage").mockImplementation(async (shapes, opts) => {
      await held
      return toImage(shapes, opts)
    })
    const click = spyOnDownloads()
    const download = toolbar.getByRole("button", { name: DOWNLOAD_PNG })

    await userEvent.click(download)

    await waitFor(() => expect(download).toHaveAttribute("aria-busy", "true"))
    await expect(actionsDisabled(toolbar)).toEqual([true, true, true])
    await userEvent.click(download)
    await userEvent.click(toolbar.getByRole("button", { name: DOWNLOAD_SVG }))
    await expect(spy).toHaveBeenCalledTimes(1)

    release?.()
    await waitFor(() => expect(click).toHaveBeenCalledTimes(1))
    await waitFor(() => expect(download).not.toHaveAttribute("aria-busy"))
    await expect(download).not.toHaveAttribute("aria-disabled", "true")
  }
}

export const BusySurvivesReselect: Story = {
  play: async ({ canvasElement }) => {
    const editor = await mountedEditor(canvasElement)
    const frame = await drawFrame(editor)
    const toolbar = await findCropToolbar(canvasElement)
    const toImage = editor.toImage.bind(editor)
    let release: (() => void) | undefined
    const held = new Promise<void>((resolve) => {
      release = resolve
    })
    const spy = spyOn(editor, "toImage").mockImplementation(async (shapes, opts) => {
      await held
      return toImage(shapes, opts)
    })
    const click = spyOnDownloads()
    await userEvent.click(toolbar.getByRole("button", { name: DOWNLOAD_PNG }))
    await waitFor(() =>
      expect(toolbar.getByRole("button", { name: DOWNLOAD_PNG })).toHaveAttribute(
        "aria-busy",
        "true"
      )
    )

    editor.selectNone()
    await waitFor(() =>
      expect(within(canvasElement).queryByRole("toolbar", { name: "Crop frame" })).toBeNull()
    )
    editor.select(frame.id)
    const reselected = await findCropToolbar(canvasElement)

    const download = reselected.getByRole("button", { name: DOWNLOAD_PNG })
    await expect(download).toHaveAttribute("aria-busy", "true")
    await expect(actionsDisabled(reselected)).toEqual([true, true, true])
    await userEvent.click(reselected.getByRole("button", { name: "Download SVG" }))
    await expect(spy).toHaveBeenCalledTimes(1)

    release?.()
    await waitFor(() => expect(click).toHaveBeenCalledTimes(1))
    await waitFor(() => expect(download).not.toHaveAttribute("aria-busy"))
  }
}

export const BusyResetsAfterUnexpectedFailure: Story = {
  play: async ({ canvasElement }) => {
    const editor = await mountedEditor(canvasElement)
    await drawFrame(editor)
    const toolbar = await findCropToolbar(canvasElement)
    spyOn(editor, "toImage").mockRejectedValue(new Error("Could not construct image."))
    const create = spyOn(toaster, "create").mockImplementation(() => {
      throw new Error("The toaster is gone")
    })
    const download = toolbar.getByRole("button", { name: DOWNLOAD_PNG })

    await userEvent.click(download)

    await waitFor(() => expect(create).toHaveBeenCalled())
    await waitFor(() => expect(download).not.toHaveAttribute("aria-busy"))
    await expect(actionsDisabled(toolbar)).toEqual([false, false, false])
  }
}

export const ExportFails: Story = {
  play: async ({ canvasElement }) => {
    const editor = await mountedEditor(canvasElement)
    const frame = await drawFrame(editor)
    const toolbar = await findCropToolbar(canvasElement)
    spyOn(editor, "toImage").mockRejectedValue(new Error("Could not construct image."))
    const download = toolbar.getByRole("button", { name: DOWNLOAD_PNG })

    await userEvent.click(download)

    const toast = await findToast("Couldn't export the image")
    await expect(toast).toHaveAttribute("data-type", "error")
    await expect(editor.getSelectedShapeIds()).toEqual([frame.id])
    await waitFor(() => expect(download).not.toHaveAttribute("aria-busy"))
    await expect(actionsDisabled(toolbar)).toEqual([false, false, false])
  }
}

export const OversizeFrame: Story = {
  play: async ({ canvasElement }) => {
    const editor = await mountedEditor(canvasElement)
    const frame = createShapeId("oversize-frame")
    editor.createShape<CropFrameShape>({
      id: frame,
      type: CROP_FRAME,
      x: 0,
      y: 0,
      props: { w: 6000, h: 1000 }
    })
    editor.select(frame)
    editor.zoomToSelection()
    const toolbar = await findCropToolbar(canvasElement)
    // A real 8192 px render is slow and not what's under test here.
    const toImage = spyOn(editor, "toImage").mockResolvedValue({
      blob: new Blob([], { type: "image/png" }),
      width: 6000,
      height: 1000
    })
    const click = spyOnDownloads()

    await userEvent.click(toolbar.getByRole("button", { name: DOWNLOAD_PNG }))

    await waitFor(() => expect(click).toHaveBeenCalledTimes(1))
    const pixelRatio = toImage.mock.lastCall?.[1]?.pixelRatio ?? Number.POSITIVE_INFINITY
    await expect(pixelRatio).toBeLessThanOrEqual(8192 / 6000)
    const toast = await findToast("Exported at reduced resolution")
    await expect(toast).toHaveAttribute("data-type", "info")
    await expectVisible(within(toast).getByText(/8192 × 1365 px/))
  }
}

export const ToolbarA11y: Story = {
  play: async ({ canvasElement }) => {
    const editor = await mountedEditor(canvasElement)
    await drawFrame(editor)
    const toolbar = await findCropToolbar(canvasElement)
    const toolbarElement = await findCropToolbarElement(canvasElement)
    await expect(actionNames(toolbar)).toEqual(ACTION_NAMES)
    await expect(toolbarElement).toHaveAccessibleDescription(
      `${MOD_KEY} + Enter on the canvas moves focus here.`
    )
    // Selecting the frame is announced with its type and export size.
    await waitFor(() =>
      expect(within(canvasElement).getByRole("status", { name: "Status" })).toHaveTextContent(
        /^Exports at 600 × 400 px, Crop frame\./
      )
    )

    editor.getContainer().focus()
    await userEvent.keyboard("{Control>}{Enter}{/Control}")
    // One roving Tab stop among the actions, and it is the focused one.
    const download = toolbar.getByRole("button", { name: DOWNLOAD_PNG })
    await waitFor(() => expect(download).toHaveFocus())
    const tabStops = toolbar.getAllByRole("button").filter((button) => button.tabIndex === 0)
    await expect(tabStops).toEqual([download])
    await userEvent.keyboard("{ArrowRight}")
    const copy = toolbar.getByRole("button", { name: COPY_IMAGE })
    await expect(copy).toHaveFocus()
    await expect(getComputedStyle(copy).outlineStyle).toBe("solid")
    await expect(getComputedStyle(copy).getPropertyValue("--tl-color-focus").trim()).not.toBe("")
    await userEvent.keyboard("{ArrowRight}")
    await expect(toolbar.getByRole("button", { name: DOWNLOAD_SVG })).toHaveFocus()
  }
}

export const EnterDownloads: Story = {
  play: async ({ canvasElement }) => {
    const editor = await mountedEditor(canvasElement)
    const frame = await drawFrame(editor)
    const toolbar = await findCropToolbar(canvasElement)
    const click = spyOnDownloads()

    editor.getContainer().focus()
    await userEvent.keyboard("{Enter}")

    await waitFor(() => expect(click).toHaveBeenCalledTimes(1))
    await expect(downloadNames(click)[0]).toMatch(DOWNLOAD_NAME)
    await expect(editor.getSelectedShapeIds()).toEqual([frame.id])
    const download = toolbar.getByRole("button", { name: /^Download PNG/ })
    await waitFor(() => expect(download).not.toHaveAttribute("aria-busy"))

    editor.getContainer().focus()
    await userEvent.keyboard("{Control>}{Enter}{/Control}")
    await waitFor(() => expect(download).toHaveFocus())
    await expect(click).toHaveBeenCalledTimes(1)
  }
}

export const FocusSurvivesKeyboardDownload: Story = {
  play: async ({ canvasElement }) => {
    const editor = await mountedEditor(canvasElement)
    await drawFrame(editor)
    const toolbar = await findCropToolbar(canvasElement)
    const download = toolbar.getByRole("button", { name: DOWNLOAD_PNG })
    const click = spyOnDownloads()
    // tldraw's export calls `document.body.focus()`, which only takes focus
    // when the body is focusable; make it so, as some pages do.
    document.body.tabIndex = -1
    try {
      editor.getContainer().focus()
      await userEvent.keyboard("{Control>}{Enter}{/Control}")
      await waitFor(() => expect(download).toHaveFocus())
      await userEvent.keyboard("{Enter}")

      await waitFor(() => expect(click).toHaveBeenCalledTimes(1))
      await waitFor(() => expect(download).not.toHaveAttribute("aria-busy"))
      await expect(download).toHaveFocus()

      editor.getContainer().focus()
      await userEvent.keyboard("{Enter}")

      await waitFor(() => expect(click).toHaveBeenCalledTimes(2))
      await waitFor(() => expect(download).not.toHaveAttribute("aria-busy"))
      await expect(editor.getContainer()).toHaveFocus()
    } finally {
      document.body.removeAttribute("tabindex")
    }
  }
}

export const CopyShortcut: Story = {
  play: async ({ canvasElement }) => {
    const editor = await mountedEditor(canvasElement)
    await drawFrame(editor)
    await findCropToolbar(canvasElement)
    const write = spyOn(navigator.clipboard, "write").mockImplementation(async ([item]) => {
      await item?.getType("image/png")
    })

    editor.getContainer().focus()
    const copy = new ClipboardEvent("copy", { bubbles: true, cancelable: true })
    editor.getContainer().dispatchEvent(copy)

    await expectVisible(await screen.findByText("Copied image"))
    await expect(copy.defaultPrevented).toBe(true)
    await expect(write).toHaveBeenCalledTimes(1)
    const [item] = write.mock.lastCall?.[0] ?? []
    await expect(item?.types).toContain("image/png")
    // tldraw's shape copy writes HTML.
    await expect(item?.types).not.toContain("text/html")
  }
}
