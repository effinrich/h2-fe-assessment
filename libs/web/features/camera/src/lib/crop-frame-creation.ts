import { createShapeId, type BoxModel, type Editor } from "tldraw"

import type { CropFrameShape } from "./types"

import { CROP_FRAME } from "./consts"
import { defaultFrameBox, frameInsertIndex } from "./utils/utils"

function cropFrameInsertIndex(editor: Editor) {
  const siblings = editor
    .getSortedChildIdsForParent(editor.getCurrentPageId())
    .flatMap((childId) => {
      const shape = editor.getShape(childId)
      if (!shape) return []
      const isMark = shape.type !== CROP_FRAME && !editor.isShapeOrAncestorLocked(shape)
      return [{ index: shape.index, isMark }]
    })
  return frameInsertIndex(siblings)
}

export function createCropFrame(editor: Editor, box: BoxModel) {
  const id = createShapeId()
  editor.markHistoryStoppingPoint("crop-frame")
  editor.createShape<CropFrameShape>({
    id,
    type: CROP_FRAME,
    x: box.x,
    y: box.y,
    index: cropFrameInsertIndex(editor),
    props: { w: box.w, h: box.h }
  })
  editor.select(id)
  // Always back to select, even with tool lock: the frame's export actions
  // only show while it is selected.
  editor.setCurrentTool("select")
}

/** The keyboard path: a default-size frame centred in the viewport. */
export function dropDefaultFrame(editor: Editor) {
  createCropFrame(editor, defaultFrameBox(editor.getViewportPageBounds(), editor.getZoomLevel()))
}
