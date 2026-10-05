import { expect, screen, spyOn, waitFor, within, type queries } from "storybook/test"
import {
  createShapeId,
  tleditors,
  tlenv,
  type BoxModel,
  type Editor,
  type TLPointerEventName,
  type VecLike
} from "tldraw"

import type { CropFrameShape } from "./types"

import { CAMERA_TOOL_ID, CROP_FRAME } from "./consts"

export const DOCUMENT_NAME = "q3-report.pdf"
export const INSIDE_BACK = createShapeId("inside-back")
export const OUTSIDE = createShapeId("outside")
export const INSIDE_FRONT = createShapeId("inside-front")
export const SEEDED_FRAME = createShapeId("seeded-frame")
export const BACKGROUND = createShapeId("background")
export const FRAME_FROM = { x: 100, y: 100 }
export const FRAME_TO = { x: 400, y: 300 }
export const FRAME_BOX = { x: 100, y: 100, w: 300, h: 200 }
export const DOWNLOAD_NAME = /^q3-report-crop-\d{8}-\d{6}\.png$/
export const MOD_KEY = tlenv.isDarwin ? "⌘" : "Ctrl"
export const DOWNLOAD_PNG = "Download PNG — Enter"
export const COPY_IMAGE = `Copy image — ${MOD_KEY} + C`
export const DOWNLOAD_SVG = "Download SVG"
export const ACTION_NAMES = [DOWNLOAD_PNG, COPY_IMAGE, DOWNLOAD_SVG]

export function getEditor(canvasElement: HTMLElement): Editor {
  const editor = tleditors
    .getMounted()
    .find((candidate) => canvasElement.contains(candidate.getContainer()))
  if (!editor) throw new Error("No tldraw editor is mounted in this story")
  return editor
}

export async function mountedEditor(canvasElement: HTMLElement): Promise<Editor> {
  return waitFor(async () => {
    const editor = getEditor(canvasElement)
    await expect(editor.getShape(INSIDE_BACK)).toBeDefined()
    return editor
  })
}

export function pointer(editor: Editor, name: TLPointerEventName, page: VecLike) {
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
export async function startDrag(editor: Editor, from: VecLike, to: VecLike) {
  pointer(editor, "pointer_down", from)
  pointer(editor, "pointer_move", { x: (from.x + to.x) / 2, y: (from.y + to.y) / 2 })
  pointer(editor, "pointer_move", to)
  // Pointer moves are queued until the next tick; wait for them to land.
  await waitFor(async () => {
    const { x, y } = editor.inputs.getCurrentPagePoint()
    await expect(Math.hypot(x - to.x, y - to.y)).toBeLessThan(0.5)
  })
}

export async function drag(editor: Editor, from: VecLike, to: VecLike) {
  await startDrag(editor, from, to)
  pointer(editor, "pointer_up", to)
}

export function clickAt(editor: Editor, page: VecLike) {
  pointer(editor, "pointer_down", page)
  pointer(editor, "pointer_up", page)
}

export function cropFrames(editor: Editor): CropFrameShape[] {
  return editor
    .getCurrentPageShapes()
    .filter((shape): shape is CropFrameShape => shape.type === CROP_FRAME)
}

export async function drawFrame(
  editor: Editor,
  from: VecLike = FRAME_FROM,
  to: VecLike = FRAME_TO
) {
  editor.setCurrentTool(CAMERA_TOOL_ID)
  await drag(editor, from, to)
  return waitFor(() => {
    const frame = cropFrames(editor).at(-1)
    if (!frame) throw new Error("No crop frame was created")
    return frame
  })
}

export async function expectBox(actual: BoxModel | undefined, expected: BoxModel) {
  await expect(actual).toBeDefined()
  const keys = ["x", "y", "w", "h"] as const
  const error = Math.max(
    ...keys.map((key) => Math.abs((actual?.[key] ?? Number.NaN) - expected[key]))
  )
  await expect(error).toBeLessThanOrEqual(1)
}

export function findMarquee(canvasElement: HTMLElement) {
  return canvasElement.querySelector<HTMLElement>("[data-crop-marquee]")
}

/** Toolbars and toasts fade in from opacity 0; let the fade settle first. */
export async function expectVisible(element: HTMLElement) {
  await waitFor(() => expect(element).toBeVisible())
}

export function findCropToolbarElement(canvasElement: HTMLElement) {
  return within(canvasElement).findByRole("toolbar", { name: "Crop frame" })
}

export type Toolbar = ReturnType<typeof within<typeof queries>>

export async function findCropToolbar(canvasElement: HTMLElement): Promise<Toolbar> {
  const toolbar = await findCropToolbarElement(canvasElement)
  const container = toolbar.closest<HTMLElement>('[data-testid="contextual-toolbar"]')
  if (!container) throw new Error("The crop toolbar is not a contextual toolbar")
  // The toolbar ignores the pointer until its show transition finishes.
  await waitFor(() => expect(container).toHaveAttribute("data-interactive", "true"))
  await waitFor(() => expect(getComputedStyle(container).opacity).toBe("1"))
  return within(toolbar)
}

export function actionNames(toolbar: Toolbar) {
  return toolbar.getAllByRole("button").map((button) => button.getAttribute("aria-label"))
}

export function actionsDisabled(toolbar: Toolbar) {
  return toolbar
    .getAllByRole("button")
    .map((button) => button.getAttribute("aria-disabled") === "true")
}

export async function findToast(text: string | RegExp) {
  const element = await screen.findByText(text)
  const toast = element.closest<HTMLElement>('[data-scope="toast"][data-part="root"]')
  if (!toast) throw new Error(`"${String(text)}" is not inside a toast`)
  await expectVisible(toast)
  return toast
}

export function spyOnDownloads() {
  return spyOn(HTMLAnchorElement.prototype, "click").mockImplementation(() => undefined)
}

export function downloadNames(click: ReturnType<typeof spyOnDownloads>): string[] {
  return click.mock.contexts.flatMap((link) =>
    link instanceof HTMLAnchorElement ? [link.download] : []
  )
}
