import {
  copyAs,
  exportAs,
  type Box,
  type Editor,
  type TLImageExportOptions,
  type TLShapeId
} from "tldraw"

import { toaster } from "@h2-fe/ui"

import type { CropAction, ExportFormat, ExportPixelSize } from "../types"

import { EXPORT_PIXEL_RATIO } from "../consts"
import {
  buildExportFilename,
  exportPixelRatio,
  exportPixelSize,
  exportShapeIds
} from "../utils/utils"

export interface CropExportPlan {
  /** Shapes to render, in z-order; never a crop frame. */
  ids: TLShapeId[]
  bounds: Box
  pixelRatio: number
  isReduced: boolean
  pixelSize: ExportPixelSize
}

/** What exporting this frame would render, read reactively from the store. */
export function getCropExportPlan(editor: Editor, frameId: TLShapeId): CropExportPlan | undefined {
  const bounds = editor.getShapePageBounds(frameId)
  if (!bounds) return undefined
  const candidates = editor.getCurrentPageShapesSorted().map((shape) => ({
    id: shape.id,
    type: shape.type,
    bounds: editor.getShapeMaskedPageBounds(shape)
  }))
  const pixelRatio = exportPixelRatio(bounds)
  return {
    ids: exportShapeIds(bounds, candidates),
    bounds,
    pixelRatio,
    isReduced: pixelRatio < EXPORT_PIXEL_RATIO,
    pixelSize: exportPixelSize(bounds, pixelRatio)
  }
}

export interface CropActionRequest {
  frameId: TLShapeId
  action: CropAction
  documentName?: string
}

export type CropActionOutcome = "done" | "failed" | "skipped"

function exportOptions(plan: CropExportPlan, format: ExportFormat): TLImageExportOptions {
  // padding 0: with explicit bounds, any other number grows them by that much.
  // darkMode false: otherwise the export follows the editor's colour mode.
  const opts: TLImageExportOptions = {
    bounds: plan.bounds,
    padding: 0,
    background: true,
    darkMode: false,
    format
  }
  return format === "svg" ? opts : { ...opts, pixelRatio: plan.pixelRatio }
}

function sizeText({ width, height }: ExportPixelSize) {
  return `${width} × ${height} px`
}

function isClipboardImageSupported() {
  return typeof ClipboardItem !== "undefined" && typeof navigator.clipboard?.write === "function"
}

async function download(
  editor: Editor,
  plan: CropExportPlan,
  format: ExportFormat,
  documentName: string | undefined
): Promise<CropActionOutcome> {
  const name = buildExportFilename({ documentName, now: new Date() })
  const filename = `${name}.${format}`
  try {
    await exportAs(editor, plan.ids, { ...exportOptions(plan, format), format, name })
  } catch {
    toaster.create({
      type: "error",
      title: "Couldn't export the image",
      description: "Something went wrong while rendering the frame. Try again."
    })
    return "failed"
  }

  if (format === "png" && plan.isReduced) {
    toaster.create({
      type: "info",
      title: "Exported at reduced resolution",
      description: `Saved ${filename} at ${sizeText(plan.pixelSize)}, the largest size we export.`
    })
  } else {
    toaster.create({
      type: "success",
      title: format === "svg" ? "SVG downloaded" : "Image downloaded",
      description: filename
    })
  }
  return "done"
}

/**
 * Not async: `copyAs` has to start in the click's call stack, or the browser
 * drops the user activation the clipboard needs.
 */
function copy(
  editor: Editor,
  plan: CropExportPlan,
  onDownloadInstead: () => void
): Promise<CropActionOutcome> {
  const downloadInstead = { label: "Download PNG", onClick: onDownloadInstead }

  if (!isClipboardImageSupported()) {
    toaster.create({
      type: "error",
      title: "Copying images isn't supported here",
      description: "Download the PNG instead.",
      action: downloadInstead
    })
    return Promise.resolve("failed")
  }

  return copyAs(editor, plan.ids, { ...exportOptions(plan, "png"), format: "png" }).then(
    (): CropActionOutcome => {
      toaster.create({
        type: "success",
        title: "Copied image",
        description: plan.isReduced
          ? `At ${sizeText(plan.pixelSize)}, the largest size we export.`
          : undefined
      })
      return "done"
    },
    (error: unknown): CropActionOutcome => {
      const isBlocked = error instanceof DOMException && error.name === "NotAllowedError"
      toaster.create({
        type: "error",
        title: "Couldn't copy the image",
        description: isBlocked
          ? "The browser blocked clipboard access. Download the PNG instead."
          : "Download the PNG instead.",
        action: downloadInstead
      })
      return "failed"
    }
  )
}

/**
 * Export a crop frame's contents and report the result in a toast. A failed
 * copy's toast offers `onDownloadInstead`.
 */
export function runCropAction(
  editor: Editor,
  request: CropActionRequest,
  onDownloadInstead: () => void
): Promise<CropActionOutcome> {
  const plan = getCropExportPlan(editor, request.frameId)
  // copyAs with no ids copies the whole page, not an empty crop.
  if (!plan || plan.ids.length === 0) return Promise.resolve("skipped")

  switch (request.action) {
    case "download-png":
      return download(editor, plan, "png", request.documentName)
    case "download-svg":
      return download(editor, plan, "svg", request.documentName)
    case "copy-png":
      return copy(editor, plan, onDownloadInstead)
    default: {
      const unhandled: never = request.action
      throw new Error(`Unknown crop action: ${String(unhandled)}`)
    }
  }
}
