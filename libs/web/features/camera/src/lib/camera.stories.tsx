import type { Meta, StoryObj } from "@storybook/react-vite"

import { useCallback, useMemo } from "react"
import { expect, restoreAllMocks, screen, spyOn, userEvent, waitFor, within } from "storybook/test"
import {
  createShapeId,
  DefaultToolbar,
  DefaultToolbarContent,
  react,
  Tldraw,
  tleditors,
  tlenv,
  ToolbarItem,
  type BoxModel,
  type Editor,
  type TLComponents,
  type TLPointerEventName,
  type TLShapeId,
  type VecLike
} from "tldraw"

import { Box, toaster } from "@h2-fe/ui"
import "tldraw/tldraw.css"

import type { CameraExtension, CropFrameShape } from "./types"

import { createCameraExtension, getCropFrameBounds } from "./camera"
import { CameraDragging } from "./camera-tool"
import { CAMERA_TOOL_ID, CROP_FRAME, FIRST_USE_HINT, FIRST_USE_HINT_STORAGE_KEY } from "./consts"
import { getCropExportPlan } from "./crop-export/crop-export"

const DOCUMENT_NAME = "q3-report.pdf"
const INSIDE_BACK = createShapeId("inside-back")
const OUTSIDE = createShapeId("outside")
const INSIDE_FRONT = createShapeId("inside-front")
const SEEDED_FRAME = createShapeId("seeded-frame")
const BACKGROUND = createShapeId("background")
const FRAME_FROM = { x: 100, y: 100 }
const FRAME_TO = { x: 400, y: 300 }
const FRAME_BOX = { x: 100, y: 100, w: 300, h: 200 }
const DOWNLOAD_NAME = /^q3-report-crop-\d{8}-\d{6}\.png$/
const MOD_KEY = tlenv.isDarwin ? "⌘" : "Ctrl"
const DOWNLOAD_PNG = "Download PNG — Enter"
const COPY_IMAGE = `Copy image — ${MOD_KEY} + C`
const DOWNLOAD_SVG = "Download SVG"
const ACTION_NAMES = [DOWNLOAD_PNG, COPY_IMAGE, DOWNLOAD_SVG]

interface CameraCanvasProps {
  readonly?: boolean
  colorScheme?: "light" | "dark"
  locale?: string
}

function seedShapes(editor: Editor) {
  // Created back to front: the outside rectangle sits between the two inside
  // ones in z-order, so the export filter has to skip it, not truncate.
  editor.createShapes([
    { id: INSIDE_BACK, type: "geo", x: 130, y: 130, props: { w: 100, h: 80, fill: "solid" } },
    { id: OUTSIDE, type: "geo", x: 600, y: 130, props: { w: 100, h: 80, color: "red" } },
    {
      id: INSIDE_FRONT,
      type: "geo",
      x: 260,
      y: 180,
      props: { w: 100, h: 80, fill: "solid", color: "green" }
    }
  ])
}

/** The slots `PdfViewerScreen` fills for an extension, on a plain `<Tldraw>`. */
function createComponents({ toolIds, InFrontOfTheCanvas }: CameraExtension): TLComponents {
  return {
    Toolbar: function CameraToolbar() {
      return (
        <DefaultToolbar>
          {toolIds.map((toolId) => (
            <ToolbarItem key={toolId} tool={toolId} />
          ))}
          <DefaultToolbarContent />
        </DefaultToolbar>
      )
    },
    InFrontOfTheCanvas
  }
}

function CameraCanvas({ readonly = false, colorScheme = "light", locale }: CameraCanvasProps) {
  const extension = useMemo(() => createCameraExtension({ documentName: DOCUMENT_NAME }), [])
  const components = useMemo(() => createComponents(extension), [extension])
  const handleMount = useCallback(
    (editor: Editor) => {
      seedShapes(editor)
      if (!readonly) return
      editor.createShape<CropFrameShape>({
        id: SEEDED_FRAME,
        type: CROP_FRAME,
        ...FRAME_FROM,
        props: { w: 300, h: 200 }
      })
      editor.select(SEEDED_FRAME)
      editor.updateInstanceState({ isReadonly: true })
    },
    [readonly]
  )

  return (
    <Box position="fixed" inset="0">
      <Tldraw
        shapeUtils={extension.shapeUtils}
        tools={extension.tools}
        overrides={extension.overrides}
        components={components}
        colorScheme={colorScheme}
        locale={locale}
        onMount={handleMount}
      />
    </Box>
  )
}

function getEditor(canvasElement: HTMLElement): Editor {
  const editor = tleditors
    .getMounted()
    .find((candidate) => canvasElement.contains(candidate.getContainer()))
  if (!editor) throw new Error("No tldraw editor is mounted in this story")
  return editor
}

async function mountedEditor(canvasElement: HTMLElement): Promise<Editor> {
  return waitFor(async () => {
    const editor = getEditor(canvasElement)
    await expect(editor.getShape(INSIDE_BACK)).toBeDefined()
    return editor
  })
}

function pointer(editor: Editor, name: TLPointerEventName, page: VecLike) {
  editor.dispatch({
    type: "pointer",
    name,
    target: "canvas",
    point: editor.pageToScreen(page),
    pointerId: 1,
    button: 0,
    isPen: false,
    shiftKey: false,
    altKey: false,
    ctrlKey: false,
    metaKey: false,
    accelKey: false
  })
}

/** Press at `from` and move to `to`, leaving the pointer down. */
async function startDrag(editor: Editor, from: VecLike, to: VecLike) {
  pointer(editor, "pointer_down", from)
  pointer(editor, "pointer_move", { x: (from.x + to.x) / 2, y: (from.y + to.y) / 2 })
  pointer(editor, "pointer_move", to)
  // Pointer moves are queued until the next tick; wait for them to land.
  await waitFor(async () => {
    const { x, y } = editor.inputs.getCurrentPagePoint()
    await expect(Math.hypot(x - to.x, y - to.y)).toBeLessThan(0.5)
  })
}

async function drag(editor: Editor, from: VecLike, to: VecLike) {
  await startDrag(editor, from, to)
  pointer(editor, "pointer_up", to)
}

function clickAt(editor: Editor, page: VecLike) {
  pointer(editor, "pointer_down", page)
  pointer(editor, "pointer_up", page)
}

function cropFrames(editor: Editor): CropFrameShape[] {
  return editor
    .getCurrentPageShapes()
    .filter((shape): shape is CropFrameShape => shape.type === CROP_FRAME)
}

async function drawFrame(editor: Editor, from: VecLike = FRAME_FROM, to: VecLike = FRAME_TO) {
  editor.setCurrentTool(CAMERA_TOOL_ID)
  await drag(editor, from, to)
  return waitFor(() => {
    const frame = cropFrames(editor).at(-1)
    if (!frame) throw new Error("No crop frame was created")
    return frame
  })
}

async function expectBox(actual: BoxModel | undefined, expected: BoxModel) {
  await expect(actual).toBeDefined()
  const keys = ["x", "y", "w", "h"] as const
  const error = Math.max(
    ...keys.map((key) => Math.abs((actual?.[key] ?? Number.NaN) - expected[key]))
  )
  await expect(error).toBeLessThanOrEqual(1)
}

function findMarquee(canvasElement: HTMLElement) {
  return canvasElement.querySelector<HTMLElement>("[data-crop-marquee]")
}

/** Toolbars and toasts fade in from opacity 0; let the fade settle first. */
async function expectVisible(element: HTMLElement) {
  await waitFor(() => expect(element).toBeVisible())
}

function findCropToolbarElement(canvasElement: HTMLElement) {
  return within(canvasElement).findByRole("toolbar", { name: "Crop frame" })
}

async function findCropToolbar(canvasElement: HTMLElement) {
  const toolbar = await findCropToolbarElement(canvasElement)
  const container = toolbar.closest<HTMLElement>('[data-testid="contextual-toolbar"]')
  if (!container) throw new Error("The crop toolbar is not a contextual toolbar")
  // The toolbar ignores the pointer until its show transition finishes.
  await waitFor(() => expect(container).toHaveAttribute("data-interactive", "true"))
  await waitFor(() => expect(getComputedStyle(container).opacity).toBe("1"))
  return within(toolbar)
}

type Toolbar = Awaited<ReturnType<typeof findCropToolbar>>

function actionNames(toolbar: Toolbar) {
  return toolbar.getAllByRole("button").map((button) => button.getAttribute("aria-label"))
}

function actionsDisabled(toolbar: Toolbar) {
  return toolbar
    .getAllByRole("button")
    .map((button) => button.getAttribute("aria-disabled") === "true")
}

async function findToast(text: string | RegExp) {
  const element = await screen.findByText(text)
  const toast = element.closest<HTMLElement>('[data-scope="toast"][data-part="root"]')
  if (!toast) throw new Error(`"${String(text)}" is not inside a toast`)
  await expectVisible(toast)
  return toast
}

function spyOnDownloads() {
  return spyOn(HTMLAnchorElement.prototype, "click").mockImplementation(() => undefined)
}

function downloadNames(click: ReturnType<typeof spyOnDownloads>): string[] {
  return click.mock.contexts.flatMap((link) =>
    link instanceof HTMLAnchorElement ? [link.download] : []
  )
}

const meta = {
  title: "Features/Camera",
  component: CameraCanvas,
  parameters: { layout: "fullscreen" },
  beforeEach() {
    toaster.remove()
    sessionStorage.removeItem(FIRST_USE_HINT_STORAGE_KEY)
    return () => {
      restoreAllMocks()
      toaster.remove()
    }
  }
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
    await waitFor(() => expect(editor.getInstanceState().isFocused).toBe(true))
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
