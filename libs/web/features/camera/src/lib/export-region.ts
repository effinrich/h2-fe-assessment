import { type Box, copyAs, exportAs, type Editor } from "tldraw"

import { CROP_TYPE } from "./crop-shape-util"

/**
 * The shapes under a region: anything whose masked page bounds meet it, less
 * the crops themselves, which are the frame rather than the picture.
 */
function shapesUnder(editor: Editor, region: Box) {
  return editor
    .getCurrentPageShapes()
    .filter((shape) => shape.type !== CROP_TYPE)
    .filter((shape) => {
      const bounds = editor.getShapeMaskedPageBounds(shape)
      return bounds !== undefined && region.collides(bounds)
    })
    .map((shape) => shape.id)
}

/** Writes the region out as an image file. */
export function exportRegion(editor: Editor, region: Box, format: "png" | "svg") {
  const ids = shapesUnder(editor, region)
  if (ids.length === 0) return
  void exportAs(editor, ids, { format, name: "Crop", bounds: region })
}

/** Copies the region to the clipboard as an image. */
export function copyRegion(editor: Editor, region: Box, format: "png" | "svg") {
  const ids = shapesUnder(editor, region)
  if (ids.length === 0) return
  void copyAs(editor, ids, { format, bounds: region })
}
