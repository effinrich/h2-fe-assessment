import { useEffect } from "react"
import { useEditor, useValue } from "tldraw"

import { CROP_FRAME, CROP_ONLY_SELECTION_ATTR } from "../consts"

// tldraw shows an opacity-only panel for shapes without styles; the
// extension contract has no `StylePanel` slot to swap, so hide it in CSS.
const HIDE_STYLE_PANEL_CSS = `.tl-container[${CROP_ONLY_SELECTION_ATTR}] .tlui-style-panel { display: none; }`

/** Hides tldraw's style panel while the selection is only crop frames. */
export function StylePanelGuard() {
  const editor = useEditor()
  const isCropOnly = useValue(
    "crop-only selection",
    () => {
      if (!editor.isIn("select")) return false
      const shapes = editor.getSelectedShapes()
      return shapes.length > 0 && shapes.every((shape) => shape.type === CROP_FRAME)
    },
    [editor]
  )

  useEffect(() => {
    const container = editor.getContainer()
    container.toggleAttribute(CROP_ONLY_SELECTION_ATTR, isCropOnly)
    return () => container.removeAttribute(CROP_ONLY_SELECTION_ATTR)
  }, [editor, isCropOnly])

  return (
    <style href="h2-camera-style-panel-guard" precedence="default">
      {HIDE_STYLE_PANEL_CSS}
    </style>
  )
}
