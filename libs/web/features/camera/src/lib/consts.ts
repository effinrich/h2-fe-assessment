import { tlenv } from "tldraw"

import type { CropAction } from "./types"

export const CAMERA_TOOL_ID = "camera"
export const CAMERA_KBD = "c"
/** A verb, so the tooltip says what the tool does. */
export const CAMERA_TOOL_LABEL = "Export area"
export const FIRST_USE_HINT = "Drag to frame an area to export · Esc to cancel"
export const FIRST_USE_HINT_STORAGE_KEY = "h2-camera-first-use-hint-seen"

export const CROP_FRAME = "crop-frame"

/** The keyboard-created frame's on-screen size, capped to a share of the viewport. */
export const DEFAULT_FRAME_SCREEN_PX = { w: 300, h: 200 } as const
export const DEFAULT_FRAME_MAX_VIEWPORT_SHARE = 0.8
/** A drag smaller than this on screen, in either direction, creates nothing. */
export const MIN_FRAME_SCREEN_PX = 16
/** Neither side of a raster export may exceed this, in device pixels. */
export const MAX_EXPORT_SIDE_PX = 8192
/** Device pixels per raster export: the smallest common browser canvas-area limit. */
export const MAX_EXPORT_AREA_PX = 4096 * 4096
export const EXPORT_PIXEL_RATIO = 2
/** Page units: a shape this close to the crop still counts as inside. */
export const EXPORT_EDGE_SLOP = 4

export const FALLBACK_EXPORT_BASENAME = "canvas"
export const MAX_EXPORT_BASENAME_LENGTH = 100

export const CROP_FRAME_TOOLBAR_LABEL = "Crop frame"
export const CROP_FRAME_TOOLBAR_CLASS = "h2-crop-frame-toolbar"
const MOD_KEY = tlenv.isDarwin ? "⌘" : "Ctrl"
export const CROP_FRAME_TOOLBAR_DESCRIPTION = `${MOD_KEY} + Enter on the canvas moves focus here.`
export const CROP_ACTION_LABELS: Readonly<Record<CropAction, string>> = {
  "download-png": "Download PNG — Enter",
  "copy-png": `Copy image — ${MOD_KEY} + C`,
  "download-svg": "Download SVG"
}
/** Marks the size label, which the toolbar must not cover when it sits below the frame. */
export const CROP_FRAME_LABEL_ATTR = "data-crop-frame-label"

/** On the editor container while the selection is only crop frames. */
export const CROP_ONLY_SELECTION_ATTR = "data-crop-only-selection"
/** `TldrawUiContextualToolbar`'s private TOOLBAR_GAP and SCREEN_MARGIN (tldraw 5.5.0). */
export const TOOLBAR_GAP_PX = 8
export const TOOLBAR_MARGIN_PX = 16
export const EMPTY_FRAME_HINT = "Nothing inside"
/** How long a finished action shows its check mark. */
export const ACTION_DONE_MS = 1500

/** On-screen sizes of the frame's chrome, in CSS pixels at any zoom. */
export const FRAME_CORNER_PX = 14
