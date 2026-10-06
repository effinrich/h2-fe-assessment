import { useEditor, useValue } from "tldraw"

import type { CameraDragging } from "../camera-tool"

import { CAMERA_TOOL_ID, MARQUEE_STYLE } from "../consts"

const DRAGGING_PATH = `${CAMERA_TOOL_ID}.dragging`

/** The box being dragged out, in viewport space (the `InFrontOfTheCanvas` slot). */
export function CropMarquee() {
  const editor = useEditor()
  const style = useValue(
    "crop marquee",
    () => {
      if (!editor.isIn(DRAGGING_PATH)) return null
      const box = editor.getStateDescendant<CameraDragging>(DRAGGING_PATH)?.box.get()
      if (!box) return null
      const zoom = editor.getZoomLevel()
      const { x, y } = editor.pageToViewport(box)
      return {
        ...MARQUEE_STYLE,
        width: box.w * zoom,
        height: box.h * zoom,
        transform: `translate(${x}px, ${y}px)`
      }
    },
    [editor]
  )
  return style && <div style={style} />
}
