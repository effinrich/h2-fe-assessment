import type { VecModel } from "tldraw"

export const PIN_TOOL_ID = "pin"
export const PIN_SHAPE = "pin"
export const PIN_BINDING = "pin"
export const PIN_KBD = "p"
export const PIN_LABEL_KEY = "tool.pin"
export const PIN_LABEL = "Pin"
export const FIRST_USE_HINT = "Click or drag to pin · Esc to cancel"
export const FIRST_USE_HINT_STORAGE_KEY = "h2-pin-first-use-hint-seen"

/**
 * The glyph is drawn in a 24×36 box; this scales it, and everything below, to
 * page units. PDF pages are laid out at 2 page units per point.
 */
export const PIN_SCALE = 2

const page = (art: number) => art * PIN_SCALE

/** Page units, so on screen the pin scales with the zoom like any shape. */
export const PIN_SIZE = { w: page(24), h: page(36) } as const

/** The needle tip, relative to the pin's origin: the point that attaches. */
export const PIN_TIP: VecModel = { x: page(12), y: page(36) }

/** Head circle in page units: hit geometry, rings and halo. */
export const PIN_HEAD = { cx: page(12), cy: page(10), r: page(9) } as const
/** Hit area for collar and needle: wider than drawn, so the thin needle is grabbable. */
export const PIN_NEEDLE_HIT = { x: page(7.5), y: page(17), w: page(9) } as const
export const PIN_OUTLINE_PATH = [
  `M${page(12)} ${page(1)} A${page(9)} ${page(9)} 0 1 1 ${page(11.99)} ${page(1)} Z`,
  `M${page(7.5)} ${page(17)} L${page(16.5)} ${page(17)} L${page(14.5)} ${page(24)} L${page(9.5)} ${page(24)} Z`,
  `M${page(11)} ${page(24)} L${page(13)} ${page(24)} L${page(12.5)} ${page(36)} L${page(11.5)} ${page(36)} Z`
].join(" ")

/** Head, collar and needle in the glyph's 24×36 art box. */
export const PIN_ART_HEAD = { cx: 12, cy: 10, r: 9 } as const
export const PIN_ART_COLLAR_PATH = "M7.5 17 L16.5 17 L14.5 24 L9.5 24 Z"
export const PIN_ART_NEEDLE = { x: 12, y1: 24, y2: 35 } as const

/** Positions and offsets closer than this (page units) are left untouched. */
export const PIN_EPSILON = 0.01

export const ATTACH_FLASH_MS = 800

export const BADGE_CAP = 9

/** Below this zoom the glyph keeps the screen size it has here. */
export const MIN_GLYPH_ZOOM = 0.5

/** Opacity of a free pin's outline and needle, drawn in the theme's text colour. */
export const FREE_LINE_OPACITY = 0.7

export const ATTACH_OVERLAY = "pin-attach"
export const HELD_OVERLAY = "pin-held"

/** Interactions whose end is a rest: the pins they can have affected settle. */
export const REST_INTERACTIONS = ["select.translating", "select.resizing", "select.rotating"]

export const ARROW_KEYS: ReadonlySet<string> = new Set([
  "ArrowLeft",
  "ArrowRight",
  "ArrowUp",
  "ArrowDown"
])
