import type { Meta, StoryObj } from "@storybook/react-vite"
import type { TLShape } from "tldraw"

import { expect, waitFor, within } from "storybook/test"
import { createShapeId } from "tldraw"

import { ATTACH_FLASH_MS, PIN_HEAD } from "./consts"
import { createPinExtension } from "./pin-extension"
import { feedbackOf } from "./pin-feedback-overlay"
import { PinStoryCanvas } from "./pin-story-canvas"
import {
  A,
  A_AND_B,
  B,
  blendOver,
  contrastRatio,
  EMPTY,
  glyphOf,
  headOf,
  held,
  hoverAt,
  isDisplayed,
  mountedEditor,
  overlayIds,
  pinElement,
  pins,
  placePin,
  recordStrokes,
  rgbOf,
  seed,
  tipOf
} from "./story-helpers"

const pinExtension = createPinExtension()

const PAGE = createShapeId("page-1")
const isPdfPageLike = (shape: TLShape) =>
  shape.type === "image" && /^shape:page-\d+$/.test(shape.id)
// What the viewer route passes (pdf-viewer's isPdfPageShape, mirrored here
// because this lib may not import a sibling feature).
const viewerPinExtension = createPinExtension({ canAttach: (shape) => !isPdfPageLike(shape) })

const meta = {
  title: "Features/Pin/Attach",
  render: () => <PinStoryCanvas extension={pinExtension} />
} satisfies Meta

export default meta
type Story = StoryObj<typeof meta>

export const PlaceOnOverlapAttachesBoth: Story = {
  play: async ({ canvasElement, userEvent }) => {
    const editor = await mountedEditor(canvasElement)
    seed(editor)

    const pin = await placePin(userEvent, editor, canvasElement, A_AND_B)

    await expect(pins(editor)).toHaveLength(1)
    await expect(held(editor, pin)).toEqual(new Set([A, B]))
    await expect(tipOf(editor, pin)).toEqual(A_AND_B)
    await expect(editor.getSelectedShapeIds()).toEqual([pin])
    await expect(editor.getCurrentToolId()).toBe("select")
    await expect(pinElement(canvasElement, pin)).toHaveAttribute("data-state", "holding")
  }
}

export const PlaceAttachesAllUnderPoint: Story = {
  play: async ({ canvasElement, userEvent }) => {
    const editor = await mountedEditor(canvasElement)
    const D = createShapeId("d")
    seed(editor)
    editor.run(
      () => editor.createShape({ id: D, type: "geo", x: 160, y: 70, props: { w: 60, h: 60 } }),
      { history: "ignore" }
    )

    const pin = await placePin(userEvent, editor, canvasElement, A_AND_B)

    await expect(held(editor, pin)).toEqual(new Set([A, B, D]))
    await expect(within(pinElement(canvasElement, pin)).getByText("3")).toBeInTheDocument()
  }
}

export const FreePinOnEmptyCanvas: Story = {
  play: async ({ canvasElement, userEvent }) => {
    const editor = await mountedEditor(canvasElement)
    seed(editor)

    const pin = await placePin(userEvent, editor, canvasElement, EMPTY)

    await expect(held(editor, pin)).toEqual(new Set())
    await expect(pinElement(canvasElement, pin)).toHaveAttribute("data-state", "free")
  }
}

export const FreePinContrast: Story = {
  play: async ({ canvasElement, userEvent }) => {
    const editor = await mountedEditor(canvasElement)
    seed(editor)
    const pin = await placePin(userEvent, editor, canvasElement, EMPTY)
    const { colorScheme } = editor.user.getUserPreferences()
    const { light } = editor.getCurrentTheme().colors
    // Control: the theme grey on its own is under 3:1 on the light canvas.
    await expect(contrastRatio(rgbOf(light.grey.solid), rgbOf(light.background))).toBeLessThan(3)

    const expectContrastIn = async (mode: "light" | "dark") => {
      editor.user.updateUserPreferences({ colorScheme: mode })
      const background = rgbOf(editor.getCurrentTheme().colors[mode].background)
      await waitFor(async () => {
        const head = glyphOf(canvasElement, pin).querySelector("circle")
        if (!head) throw new Error("no head")
        const style = getComputedStyle(head)
        const outline = blendOver(rgbOf(style.stroke), background, Number(style.strokeOpacity))
        await expect(contrastRatio(outline, background), mode).toBeGreaterThanOrEqual(3)
      })
    }

    try {
      await expectContrastIn("light")
      await expectContrastIn("dark")
    } finally {
      editor.user.updateUserPreferences({ colorScheme })
    }
  }
}

export const PinKeepsMinimumSize: Story = {
  play: async ({ canvasElement, userEvent }) => {
    const editor = await mountedEditor(canvasElement)
    seed(editor)
    const pin = await placePin(userEvent, editor, canvasElement, EMPTY)
    const height = () => glyphOf(canvasElement, pin).getBoundingClientRect().height
    const hitBounds = () => editor.getShapeGeometry(pin).bounds.toJson()

    editor.setCamera({ ...editor.getCamera(), z: 1 }, { immediate: true })
    await waitFor(() => expect(height()).toBeCloseTo(72, 0))
    const pageHitBounds = hitBounds()

    editor.setCamera({ ...editor.getCamera(), z: 0.25 }, { immediate: true })
    await waitFor(() => expect(height()).toBeCloseTo(36, 0))
    const tip = editor.pageToScreen(tipOf(editor, pin))
    await expect(glyphOf(canvasElement, pin).getBoundingClientRect().bottom).toBeCloseTo(tip.y, 0)
    await expect(hitBounds()).toEqual(pageHitBounds)
  }
}

export const OutlinesHaveUnderlay: Story = {
  play: async ({ canvasElement, userEvent }) => {
    const editor = await mountedEditor(canvasElement)
    seed(editor)
    const pin = await placePin(userEvent, editor, canvasElement, A_AND_B)
    const feedback = feedbackOf(editor)
    if (!feedback) throw new Error("no feedback overlay")
    const zoom = editor.getZoomLevel()
    const { background, red } = editor.getCurrentTheme().colors[editor.getColorMode()]
    const strokes = () =>
      recordStrokes((ctx) => feedback.render(ctx, feedback.getOverlays())).map(
        ({ color, width, dash }) => ({ color, width, dash })
      )
    // The canvas keeps widths and dashes as float32.
    const px = (screen: number) => expect.closeTo(screen / zoom, 5)
    const underlay = { color: rgbOf(background), width: px(5), dash: [] }
    const accent = { color: rgbOf(red.solid), width: px(2) }

    await expect(strokes()).toEqual([underlay, { ...accent, dash: [] }])

    await waitFor(() => expect(overlayIds(editor, "pin-attach:")).toEqual([]), {
      timeout: ATTACH_FLASH_MS * 2
    })
    await expect(editor.getSelectedShapeIds()).toEqual([pin])
    await expect(strokes()).toEqual([underlay, { ...accent, dash: [px(6), px(4)] }])
  }
}

export const ReducedMotionHalo: Story = {
  play: async ({ canvasElement, userEvent }) => {
    const editor = await mountedEditor(canvasElement)
    seed(editor)
    const pin = await placePin(userEvent, editor, canvasElement, A_AND_B)

    const element = pinElement(canvasElement, pin)
    const halo = element.querySelector<HTMLElement>('[data-ring="halo"]')
    const ping = element.querySelector<HTMLElement>('[data-ring="ping"]')
    if (!halo || !ping) throw new Error("no halo or ping")
    const style = getComputedStyle(halo)
    const diameter = PIN_HEAD.r * 2 + 6
    await expect({
      width: style.width,
      height: style.height,
      left: style.left,
      top: style.top,
      opacity: style.opacity
    }).toEqual({
      width: `${diameter}px`,
      height: `${diameter}px`,
      left: `${PIN_HEAD.cx - diameter / 2}px`,
      top: `${PIN_HEAD.cy - diameter / 2}px`,
      opacity: "0.5"
    })

    const reduce = matchMedia("(prefers-reduced-motion: reduce)").matches
    await expect({ halo: isDisplayed(halo), ping: isDisplayed(ping) }).toEqual({
      halo: reduce,
      ping: !reduce
    })
  }
}

export const NeverAttachesToPdfPage: Story = {
  render: () => <PinStoryCanvas extension={viewerPinExtension} />,
  play: async ({ canvasElement, userEvent }) => {
    const editor = await mountedEditor(canvasElement)
    seed(editor, {
      under: [
        {
          id: PAGE,
          type: "image",
          x: -40,
          y: -40,
          isLocked: true,
          props: { w: 620, h: 380 }
        }
      ]
    })

    const onA = await placePin(userEvent, editor, canvasElement, { x: 60, y: 60 })
    await expect(held(editor, onA)).toEqual(new Set([A]))

    const onPage = await placePin(userEvent, editor, canvasElement, EMPTY)
    await expect(held(editor, onPage)).toEqual(new Set())

    // canAttach applies on its own, not only through the locked rule.
    editor.run(() => editor.updateShape({ id: PAGE, type: "image", isLocked: false }), {
      history: "ignore"
    })
    const onUnlockedPage = await placePin(userEvent, editor, canvasElement, { x: 380, y: 250 })
    await expect(held(editor, onUnlockedPage)).toEqual(new Set())

    // Virtualisation evicts the page; the mark's pin survives.
    editor.run(() => editor.deleteShapes([PAGE]), { history: "ignore", ignoreShapeLock: true })
    await expect(editor.getShape(onA)).toBeDefined()
    await expect(held(editor, onA)).toEqual(new Set([A]))
  }
}

/** The control for NeverAttachesToPdfPage: without the viewer's `canAttach`, the page attaches. */
export const PlainExtensionAttachesUnlockedPage: Story = {
  play: async ({ canvasElement, userEvent }) => {
    const editor = await mountedEditor(canvasElement)
    seed(editor, {
      under: [{ id: PAGE, type: "image", x: -40, y: -40, props: { w: 620, h: 380 } }]
    })

    const onPage = await placePin(userEvent, editor, canvasElement, EMPTY)

    await expect(held(editor, onPage)).toEqual(new Set([PAGE]))
  }
}

export const NeverAttachesToLockedShapes: Story = {
  play: async ({ canvasElement, userEvent }) => {
    const editor = await mountedEditor(canvasElement)
    seed(editor)
    editor.run(() => editor.updateShape({ id: B, type: "geo", isLocked: true }), {
      history: "ignore"
    })

    const pin = await placePin(userEvent, editor, canvasElement, A_AND_B)

    await expect(held(editor, pin)).toEqual(new Set([A]))
  }
}

export const AttachFeedback: Story = {
  play: async ({ canvasElement, userEvent }) => {
    const editor = await mountedEditor(canvasElement)
    seed(editor)
    const heldOutlines = new Set([`pin-held:${A}`, `pin-held:${B}`])

    const pin = await placePin(userEvent, editor, canvasElement, A_AND_B)

    await expect(new Set(overlayIds(editor, "pin-attach:"))).toEqual(
      new Set([`pin-attach:${A}`, `pin-attach:${B}`])
    )
    await expect(pinElement(canvasElement, pin)).toHaveAttribute("data-attaching")

    await waitFor(() => expect(overlayIds(editor, "pin-attach:")).toEqual([]), {
      timeout: ATTACH_FLASH_MS * 2
    })
    await expect(pinElement(canvasElement, pin)).not.toHaveAttribute("data-attaching")

    editor.selectNone()
    await hoverAt(userEvent, editor, EMPTY)
    await waitFor(() => expect(overlayIds(editor, "pin-")).toEqual([]))

    await hoverAt(userEvent, editor, headOf(editor, pin))
    await waitFor(() => expect(new Set(overlayIds(editor, "pin-held:"))).toEqual(heldOutlines))

    await hoverAt(userEvent, editor, EMPTY)
    await waitFor(() => expect(overlayIds(editor, "pin-")).toEqual([]))

    editor.select(pin)
    await expect(new Set(overlayIds(editor, "pin-held:"))).toEqual(heldOutlines)
  }
}
