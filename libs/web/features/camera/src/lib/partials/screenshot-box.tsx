import { useEditor, useValue } from "tldraw"

import { CAMERA_TOOL_ID, type CameraDragging } from "../camera-tool"

const DRAGGING_PATH = `${CAMERA_TOOL_ID}.dragging`

/** The box being dragged out, in viewport space (the `InFrontOfTheCanvas` slot). */
export function ScreenshotBox() {
  const editor = useEditor()
  const box = useValue(
    "screenshot brush",
    () => {
      if (editor.getPath() !== DRAGGING_PATH) return null
      const page = editor.getStateDescendant<CameraDragging>(DRAGGING_PATH)?.box.get()
      if (!page) return null
      const zoom = editor.getZoomLevel()
      const { x, y } = editor.pageToViewport(page)
      return { x, y, w: page.w * zoom, h: page.h * zoom }
    },
    [editor]
  )
  if (!box) return null
  return (
    <div
      style={{
        position: "absolute",
        top: 0,
        left: 0,
        transform: `translate(${box.x}px, ${box.y}px)`,
        width: box.w,
        height: box.h,
        border: "1px solid var(--tl-color-text-0)",
        zIndex: 999
      }}
    />
  )
}
