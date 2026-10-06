import type { CSSProperties } from "react"

export const CAMERA_TOOL_ID = "camera"
export const CAMERA_LABEL_KEY = "tool.camera"
export const CAMERA_LABEL = "Export area"
export const CAMERA_KBD = "c"

export const CROP_FRAME = "crop-frame"
export const CROP_TOOLBAR_LABEL = "Export area"

/** A drag smaller than this on screen, in either direction, creates no frame. */
export const MIN_FRAME_SCREEN_PX = 16

/** Page space: `--tl-scale` keeps the border one width on screen at any zoom. */
export const FRAME_STYLE: CSSProperties = {
  boxSizing: "border-box",
  border: "calc(1.5px * var(--tl-scale)) dashed var(--tl-color-primary)"
}

export const MARQUEE_STYLE: CSSProperties = {
  position: "absolute",
  top: 0,
  left: 0,
  pointerEvents: "none",
  border: "1.5px dashed var(--tl-color-primary)"
}
