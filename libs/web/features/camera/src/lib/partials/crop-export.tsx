import { type MouseEvent } from "react"
import { useEditor, useValue } from "tldraw"

import { CROP_TYPE } from "../crop-shape-util"
import { copyRegion, exportRegion } from "../export-region"

/** The export control, shown on the selected crop. */
export function CropExport() {
  const editor = useEditor()

  const crop = useValue(
    "selected crop",
    () => {
      const ids = editor.getSelectedShapeIds()
      if (ids.length !== 1) return null
      const shape = editor.getShape(ids[0])
      return shape?.type === CROP_TYPE ? shape : null
    },
    [editor]
  )

  // The label says what a click will do, so the modifiers are visible.
  const label = useValue(
    "export label",
    () => {
      if (editor.inputs.getCtrlKey()) return "Copy to clipboard"
      if (editor.inputs.getAltKey()) return "Export SVG"
      return "Export PNG"
    },
    [editor]
  )

  if (!crop) return null

  const region = editor.getShapePageBounds(crop)
  if (!region) return null

  const { x, y } = editor.pageToViewport({ x: region.x, y: region.y })
  const zoom = editor.getZoomLevel()

  const onClick = (event: MouseEvent) => {
    event.stopPropagation()
    const format = editor.inputs.getAltKey() ? "svg" : "png"
    if (editor.inputs.getCtrlKey()) copyRegion(editor, region, format)
    else exportRegion(editor, region, format)
  }

  return (
    <button
      onPointerDown={(event) => event.stopPropagation()}
      onClick={onClick}
      style={{
        position: "absolute",
        top: 0,
        left: 0,
        transform: `translate(${x + region.w * zoom}px, ${y}px) translateX(-100%)`,
        padding: "4px 8px",
        borderRadius: 6,
        border: "1px solid var(--tl-color-divider)",
        background: "var(--tl-color-background-1)",
        color: "var(--tl-color-text-1)",
        font: "500 12px/1.4 inherit",
        cursor: "pointer",
        pointerEvents: "auto",
        whiteSpace: "nowrap"
      }}
    >
      {label}
    </button>
  )
}
