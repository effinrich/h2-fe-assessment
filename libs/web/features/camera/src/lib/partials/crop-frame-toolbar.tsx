import { ClipboardCopy, ImageDown, VectorSquare } from "lucide-react"
import { useCallback } from "react"
import { TldrawUiContextualToolbar, useEditor, useValue, type TLUiIconJsx } from "tldraw"

import type { CropAction } from "../types"

import { CROP_FRAME, CROP_TOOLBAR_LABEL } from "../consts"
import { exportCropFrame } from "../crop-export"
import { CropActionButton } from "./crop-action-button"

const ACTIONS: readonly { action: CropAction; label: string; icon: TLUiIconJsx }[] = [
  {
    action: "download-png",
    label: "Download PNG",
    icon: <ImageDown size={18} strokeWidth={1.75} />
  },
  {
    action: "download-svg",
    label: "Download SVG",
    icon: <VectorSquare size={18} strokeWidth={1.75} />
  },
  { action: "copy-png", label: "Copy image", icon: <ClipboardCopy size={18} strokeWidth={1.75} /> }
]

/** Export actions above the selected crop frame (the `InFrontOfTheCanvas` slot). */
export function CropFrameToolbar({ documentName }: { documentName?: string }) {
  const editor = useEditor()
  const frameId = useValue(
    "crop frame toolbar target",
    () => {
      const shape = editor.getOnlySelectedShape()
      if (shape?.type !== CROP_FRAME) return null
      return editor.isInAny("select.idle", "select.pointing_shape") ? shape.id : null
    },
    [editor]
  )
  const getSelectionBounds = useCallback(() => editor.getSelectionScreenBounds(), [editor])
  const run = useCallback(
    (action: CropAction) => {
      if (frameId) exportCropFrame(editor, frameId, action, documentName)
    },
    [editor, frameId, documentName]
  )
  if (!frameId) return null

  return (
    <TldrawUiContextualToolbar getSelectionBounds={getSelectionBounds} label={CROP_TOOLBAR_LABEL}>
      {ACTIONS.map(({ action, label, icon }) => (
        <CropActionButton key={action} action={action} label={label} icon={icon} onRun={run} />
      ))}
    </TldrawUiContextualToolbar>
  )
}
