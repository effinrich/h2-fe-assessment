import type { Editor, TLShape, TLShapeId, TLShapePartial, VecLike, VecModel } from "tldraw"

import { expect, userEvent, waitFor, within } from "storybook/test"
import { createShapeId, Group2d, tleditors } from "tldraw"

import { PIN_BINDING, PIN_HEAD, PIN_SHAPE, PIN_TIP } from "./consts"

export type StoryUser = ReturnType<typeof userEvent.setup>

/** Seeds from the task-3 spec, in page units. A and B are unfilled. */
export const A = createShapeId("a")
export const B = createShapeId("b")
export const C = createShapeId("c")

/** Inside A and B only. */
export const A_AND_B: VecModel = { x: 175, y: 90 }
/** No seed under it. */
export const EMPTY: VecModel = { x: 360, y: 300 }

/** Points on each seed's outline: an unfilled shape is only grabbed there. */
export const A_EDGE: VecModel = { x: 0, y: 30 }
export const B_EDGE: VecModel = { x: 310, y: 150 }
/** Inside C (filled), clear of a pin placed at C's centre. */
export const C_BODY: VecModel = { x: 510, y: 100 }
export const C_CENTRE: VecModel = { x: 480, y: 60 }
/** Inside B and inside C once C is moved to (280,100); outside A. */
export const B_AND_MOVED_C: VecModel = { x: 295, y: 140 }
/** The middle of A's left edge: the resize handle while A is selected. */
export const A_LEFT_HANDLE: VecModel = { x: 0, y: 60 }
/** Inside the A∪B selection bounds but off their edges: drags the selection. */
export const IN_A_AND_B_BOUNDS: VecModel = { x: 60, y: 60 }

export const PIN_BUTTON = "Pin — P"

export async function mountedEditor(canvasElement: HTMLElement): Promise<Editor> {
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

/**
 * Seeds A, B and C outside the undo history (so `undo()` only ever reverts
 * what the story did), with `under` below them, and fits the camera so every
 * point the stories use is on screen.
 */
export function seed(editor: Editor, { under = [] }: { under?: TLShapePartial[] } = {}) {
  editor.run(
    () => {
      editor.createShapes([
        ...under,
        { id: A, type: "geo", x: 0, y: 0, props: { w: 200, h: 120 } },
        { id: B, type: "geo", x: 150, y: 60, props: { w: 160, h: 120 } },
        { id: C, type: "geo", x: 420, y: 0, props: { w: 120, h: 120, fill: "solid" } }
      ])
    },
    { history: "ignore" }
  )
  editor.zoomToBounds({ x: -60, y: -60, w: 660, h: 420 }, { inset: 0, immediate: true })
}

/** A frame around A (and clear of B and C), with A reparented into it, outside the history. */
export function seedFrameAroundA(editor: Editor): TLShapeId {
  const frame = createShapeId("frame")
  editor.run(
    () => {
      editor.createShape({ id: frame, type: "frame", x: -40, y: -40, props: { w: 260, h: 190 } })
      editor.reparentShapes([A], frame)
    },
    { history: "ignore" }
  )
  return frame
}

/** Shift+L: tldraw's toggle-lock action on the selection, as its own undo step. */
export async function toggleLock(user: StoryUser) {
  await user.keyboard("{Shift>}l{/Shift}")
}

function canvasOf(editor: Editor): Element {
  const canvas = editor.getContainer().querySelector(".tl-canvas")
  if (!canvas) throw new Error("no tldraw canvas")
  return canvas
}

function coords(editor: Editor, point: VecLike) {
  const { x, y } = editor.pageToScreen(point)
  return { clientX: x, clientY: y }
}

export async function clickAt(user: StoryUser, editor: Editor, point: VecLike) {
  const target = canvasOf(editor)
  await user.pointer([
    { keys: "[MouseLeft>]", target, coords: coords(editor, point) },
    { keys: "[/MouseLeft]", target, coords: coords(editor, point) }
  ])
}

export async function hoverAt(user: StoryUser, editor: Editor, point: VecLike) {
  await user.pointer({ target: canvasOf(editor), coords: coords(editor, point) })
}

function dragSteps(editor: Editor, target: Element, from: VecLike, to: VecLike) {
  return [0.25, 0.5, 0.75, 1].map((t) => ({
    target,
    coords: coords(editor, { x: from.x + (to.x - from.x) * t, y: from.y + (to.y - from.y) * t })
  }))
}

/** A real pointer drag: press, a few moves past the drag threshold, release. */
export async function dragFrom(user: StoryUser, editor: Editor, from: VecLike, to: VecLike) {
  const target = canvasOf(editor)
  await user.pointer([
    { keys: "[MouseLeft>]", target, coords: coords(editor, from) },
    ...dragSteps(editor, target, from, to),
    { keys: "[/MouseLeft]", target, coords: coords(editor, to) }
  ])
}

/** The first half of `dragFrom`: the button stays down until `releaseAt`. */
export async function pressAndMove(user: StoryUser, editor: Editor, from: VecLike, to: VecLike) {
  const target = canvasOf(editor)
  await user.pointer([
    { keys: "[MouseLeft>]", target, coords: coords(editor, from) },
    ...dragSteps(editor, target, from, to)
  ])
}

export async function releaseAt(user: StoryUser, editor: Editor, point: VecLike) {
  await user.pointer({
    keys: "[/MouseLeft]",
    target: canvasOf(editor),
    coords: coords(editor, point)
  })
}

/**
 * Ctrl+D. tldraw can miss the Control key-up right after the shortcut, and
 * then releases Ctrl only on a later pointer event without it (after a
 * debounce). A drag that starts with Ctrl held snaps instead of moving
 * freely, so hover (1px apart each try, so no move is deduplicated) until
 * Ctrl reads as released.
 */
export async function duplicateSelection(user: StoryUser, editor: Editor) {
  await user.keyboard("{Control>}d{/Control}")
  let jitter = 0
  await waitFor(async () => {
    jitter = 1 - jitter
    await hoverAt(user, editor, { x: EMPTY.x + jitter, y: EMPTY.y })
    await expect(editor.inputs.getCtrlKey()).toBe(false)
  })
}

/** Picks the pin tool from the toolbar and clicks `point` with it. */
export async function placePin(
  user: StoryUser,
  editor: Editor,
  canvasElement: HTMLElement,
  point: VecLike
): Promise<TLShapeId> {
  const before = new Set(pins(editor).map((pin) => pin.id))
  await user.click(within(canvasElement).getByRole("button", { name: PIN_BUTTON }))
  await clickAt(user, editor, point)
  const placed = pins(editor).find((pin) => !before.has(pin.id))
  if (!placed) throw new Error("no pin was placed")
  return placed.id
}

export function pins(editor: Editor): TLShape[] {
  return editor.getCurrentPageShapes().filter((shape) => shape.type === PIN_SHAPE)
}

/** A set, so assertions don't depend on binding order. */
export function held(editor: Editor, pinId: TLShapeId): Set<TLShapeId> {
  return new Set(editor.getBindingsFromShape(pinId, PIN_BINDING).map((binding) => binding.toId))
}

/** Ids of the current canvas overlays starting with `prefix`. */
export function overlayIds(editor: Editor, prefix: string): string[] {
  return editor.overlays
    .getCurrentOverlays()
    .map((overlay) => overlay.id)
    .filter((id) => id.startsWith(prefix))
}

export function allPinBindings(editor: Editor) {
  return pins(editor).flatMap((pin) => editor.getBindingsFromShape(pin, PIN_BINDING))
}

/** The pin point (needle tip), in page space. */
export function tipOf(editor: Editor, pinId: TLShapeId): VecModel {
  const tip = editor.getShapePageTransform(pinId).applyToPoint(PIN_TIP)
  return { x: tip.x, y: tip.y }
}

/** The pin's head: where a user grabs it. */
export function headOf(editor: Editor, pinId: TLShapeId): VecModel {
  const tip = tipOf(editor, pinId)
  return { x: tip.x, y: tip.y - PIN_TIP.y + PIN_HEAD.cy }
}

export function plus(point: VecModel, delta: VecModel): VecModel {
  return { x: point.x + delta.x, y: point.y + delta.y }
}

export function minus(point: VecModel, other: VecModel): VecModel {
  return { x: point.x - other.x, y: point.y - other.y }
}

/** Matches a point within ±0.5: pointer drags round through screen pixels. */
export function near(point: VecModel) {
  return { x: expect.closeTo(point.x, 0), y: expect.closeTo(point.y, 0) }
}

/** Page origins (page-space needle tips for pins) of `ids`, for before/after comparisons. */
export function snapshot(editor: Editor, ids: readonly TLShapeId[]): Map<TLShapeId, VecModel> {
  return new Map(
    ids.map((id) => [
      id,
      editor.getShape(id)?.type === PIN_SHAPE ? tipOf(editor, id) : positionOf(editor, id)
    ])
  )
}

/** The centre of a frame's heading, the part of a frame a user grabs. */
export function frameHeadingOf(editor: Editor, frameId: TLShapeId): VecModel {
  const geometry = editor.getShapeGeometry(frameId)
  const heading =
    geometry instanceof Group2d ? geometry.children.find((child) => child.isLabel) : undefined
  if (!heading) throw new Error(`no heading on ${frameId}`)
  return editor.getShapePageTransform(frameId).applyToPoint(heading.bounds.center)
}

/** The page-space centre of a selection handle, e.g. `top_right_rotate`. */
export function selectionHandleOf(editor: Editor, handle: string): VecModel {
  const overlay = editor.overlays
    .getCurrentOverlays()
    .find((candidate) => candidate.id === `selection_fg:${handle}`)
  if (!overlay) throw new Error(`no ${handle} handle`)
  const geometry = editor.overlays.getOverlayUtil(overlay).getGeometry(overlay)
  if (!geometry) throw new Error(`no geometry for ${handle}`)
  const { x, y } = geometry.bounds.center
  return { x, y }
}

export function positionOf(editor: Editor, id: TLShapeId): VecModel {
  const point = editor.getShapePageTransform(id).point()
  return { x: point.x, y: point.y }
}

export function pinElement(canvasElement: HTMLElement, pinId: TLShapeId): HTMLElement {
  const element = canvasElement.querySelector<HTMLElement>(`[data-pin-id="${pinId}"]`)
  if (!element) throw new Error(`no element for ${pinId}`)
  return element
}

export function glyphOf(canvasElement: HTMLElement, pinId: TLShapeId): SVGSVGElement {
  const svg = pinElement(canvasElement, pinId).querySelector("svg")
  if (!svg) throw new Error(`no glyph for ${pinId}`)
  return svg
}

export function isDisplayed(element: Element): boolean {
  return getComputedStyle(element).display !== "none"
}

export type Rgb = readonly [number, number, number]

/** Any CSS colour (hex, hsl, rgb) as 0–255 sRGB channels, parsed by the browser. */
export function rgbOf(color: string): Rgb {
  const ctx = document.createElement("canvas").getContext("2d")
  if (!ctx) throw new Error("no 2d context")
  ctx.fillStyle = color
  ctx.fillRect(0, 0, 1, 1)
  const [r = 0, g = 0, b = 0] = ctx.getImageData(0, 0, 1, 1).data
  return [r, g, b]
}

export interface RecordedStroke {
  color: Rgb
  width: number
  dash: number[]
  alpha: number
}

/**
 * Runs `draw` against a real 2D context wrapped to record the style in force
 * at every `stroke()` call. Assignments reach the real context, so colours
 * come back normalised by the browser.
 */
export function recordStrokes(draw: (ctx: CanvasRenderingContext2D) => void): RecordedStroke[] {
  const real = document.createElement("canvas").getContext("2d")
  if (!real) throw new Error("no 2d context")
  const strokes: RecordedStroke[] = []
  const record = () => {
    const style = real.strokeStyle
    if (typeof style !== "string") throw new Error("strokes use colours only")
    strokes.push({
      color: rgbOf(style),
      width: real.lineWidth,
      dash: real.getLineDash(),
      alpha: real.globalAlpha
    })
  }
  const recorder = new Proxy(real, {
    get(target, key) {
      if (key === "stroke") return record
      const value: unknown = Reflect.get(target, key)
      return typeof value === "function" ? value.bind(target) : value
    },
    set: (target, key, value) => Reflect.set(target, key, value)
  })
  draw(recorder)
  return strokes
}

export function blendOver(fg: Rgb, bg: Rgb, alpha: number): Rgb {
  const mix = (i: 0 | 1 | 2) => fg[i] * alpha + bg[i] * (1 - alpha)
  return [mix(0), mix(1), mix(2)]
}

function linear(channel: number): number {
  const c = channel / 255
  return c <= 0.04045 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4
}

function luminance([r, g, b]: Rgb): number {
  return 0.2126 * linear(r) + 0.7152 * linear(g) + 0.0722 * linear(b)
}

/** WCAG 2 contrast ratio. */
export function contrastRatio(a: Rgb, b: Rgb): number {
  const [la, lb] = [luminance(a), luminance(b)]
  return (Math.max(la, lb) + 0.05) / (Math.min(la, lb) + 0.05)
}

/** Each of `ids` moved by `delta` (±0.5) since `before` was taken. */
export async function expectMovedBy(
  editor: Editor,
  before: Map<TLShapeId, VecModel>,
  ids: readonly TLShapeId[],
  delta: VecModel
) {
  const after = snapshot(editor, ids)
  for (const id of ids) {
    const from = before.get(id)
    const to = after.get(id)
    if (!from || !to) throw new Error(`no position for ${id}`)
    await expect({ id, dx: to.x - from.x, dy: to.y - from.y }).toEqual({
      id,
      dx: expect.closeTo(delta.x, 0),
      dy: expect.closeTo(delta.y, 0)
    })
  }
}

export async function expectUnmoved(
  editor: Editor,
  before: Map<TLShapeId, VecModel>,
  ids: readonly TLShapeId[]
) {
  await expectMovedBy(editor, before, ids, { x: 0, y: 0 })
}
