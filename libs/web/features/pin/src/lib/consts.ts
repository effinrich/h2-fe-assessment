import type { VecModel } from "tldraw"

export const PIN_TOOL_ID = "pin"
export const PIN_SHAPE = "pin"
export const PIN_BINDING = "pin"
export const PIN_KBD = "p"
export const PIN_LABEL_KEY = "tool.pin"
export const PIN_LABEL = "Pin"
export const FIRST_USE_HINT = "Click or drag to pin · Esc to cancel"
export const FIRST_USE_HINT_STORAGE_KEY = "h2-pin-first-use-hint-seen"

/** Page units, so on screen the pin scales with the zoom like any shape. */
export const PIN_SIZE = { w: 24, h: 36 } as const

/** The needle tip, relative to the pin's origin: the point that attaches. */
export const PIN_TIP: VecModel = { x: 12, y: 36 }

/** Head, collar and needle, in the PIN_SIZE box; also the selection outline. */
export const PIN_HEAD = { cx: 12, cy: 10, r: 9 } as const
export const PIN_COLLAR_PATH = "M7.5 17 L16.5 17 L14.5 24 L9.5 24 Z"
export const PIN_NEEDLE = { x: 12, y1: 24, y2: 35 } as const
/** Hit area for collar and needle: wider than drawn, so the thin needle is grabbable. */
export const PIN_NEEDLE_HIT = { x: 7.5, y: 17, w: 9 } as const
export const PIN_OUTLINE_PATH =
  "M12 1 A9 9 0 1 1 11.99 1 Z M7.5 17 L16.5 17 L14.5 24 L9.5 24 Z M11 24 L13 24 L12.5 36 L11.5 36 Z"

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
