import { useEditor, useValue } from "tldraw"

import { Box } from "@h2-fe/ui"

import type { CameraDragging } from "../camera-tool"

import { CAMERA_TOOL_ID } from "../consts"
import { exportSizeText } from "../utils/utils"
import { CropFrameOutline } from "./crop-frame-outline"

const DRAGGING_PATH = `${CAMERA_TOOL_ID}.dragging`

/** The in-flight crop box, drawn like the frame it will become (`InFrontOfTheCanvas`). */
export function CropMarquee() {
  const editor = useEditor()
  const colorMode = useValue("crop marquee colour mode", () => editor.getColorMode(), [editor])
  const marquee = useValue(
    "crop marquee",
    () => {
      const box = editor.getStateDescendant<CameraDragging>(DRAGGING_PATH)?.marquee.get()
      if (!box) return null
      const zoom = editor.getZoomLevel()
      const { x, y } = editor.pageToViewport(box)
      const w = box.w * zoom
      const h = box.h * zoom
      // Inline style, not style props: these change every frame of the drag.
      const style = { width: w, height: h, transform: `translate(${x}px, ${y}px)` }
      return { w, h, style, label: exportSizeText(box) }
    },
    [editor]
  )
  if (!marquee) return null

  return (
    <Box
      className={colorMode}
      data-crop-marquee=""
      position="absolute"
      top="0"
      left="0"
      pointerEvents="none"
      style={marquee.style}
    >
      <CropFrameOutline
        w={marquee.w}
        h={marquee.h}
        unit={1}
        label={marquee.label}
        revealLabel
        colorMode={colorMode}
      />
    </Box>
  )
}
