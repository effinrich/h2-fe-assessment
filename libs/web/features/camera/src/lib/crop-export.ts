import { copyAs, exportAs, type Editor, type TLImageExportOptions, type TLShapeId } from "tldraw"

import { toaster } from "@h2-fe/ui"

import type { CropAction } from "./types"

import { CROP_FRAME } from "./consts"

function exportName(documentName: string | undefined) {
  return `${documentName?.replace(/\.[^.]+$/, "") || "canvas"}-crop`
}

function startExport(
  editor: Editor,
  ids: TLShapeId[],
  action: CropAction,
  opts: TLImageExportOptions,
  name: string
): Promise<void> {
  switch (action) {
    case "download-png":
      return exportAs(editor, ids, { ...opts, format: "png", name })
    case "download-svg":
      return exportAs(editor, ids, { ...opts, format: "svg", name })
    case "copy-png":
      return copyAs(editor, ids, { ...opts, format: "png" })
    default: {
      const unhandled: never = action
      throw new Error(`Unknown crop action: ${String(unhandled)}`)
    }
  }
}

/**
 * Export what a crop frame covers, cropped to it. Synchronous up to `copyAs`:
 * the clipboard needs the click's user activation.
 */
export function exportCropFrame(
  editor: Editor,
  frameId: TLShapeId,
  action: CropAction,
  documentName?: string
): void {
  const bounds = editor.getShapePageBounds(frameId)
  if (!bounds) return
  const ids = editor
    .getCurrentPageShapes()
    .filter((shape) => {
      if (shape.type === CROP_FRAME) return false
      const shapeBounds = editor.getShapeMaskedPageBounds(shape)
      return shapeBounds !== undefined && bounds.includes(shapeBounds)
    })
    .map((shape) => shape.id)
  // `copyAs` / `exportAs` with no ids would take the whole page.
  if (ids.length === 0) {
    toaster.create({ type: "info", title: "Nothing to export in this area" })
    return
  }

  const opts = { bounds, background: true, darkMode: false }
  void startExport(editor, ids, action, opts, exportName(documentName)).then(
    () => {
      if (action === "copy-png") toaster.create({ type: "success", title: "Copied image" })
    },
    () => toaster.create({ type: "error", title: "Couldn't export the area. Try again." })
  )
}
