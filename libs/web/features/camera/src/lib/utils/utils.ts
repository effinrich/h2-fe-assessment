import { getIndexBetween, type BoxModel, type IndexKey, type TLShapeId, type VecLike } from "tldraw"

import type { CropFrameShape, ExportCandidate, ExportPixelSize, FrameSibling } from "../types"

import {
  CROP_FRAME,
  DEFAULT_FRAME_MAX_VIEWPORT_SHARE,
  DEFAULT_FRAME_SCREEN_PX,
  EXPORT_EDGE_SLOP,
  EXPORT_PIXEL_RATIO,
  FALLBACK_EXPORT_BASENAME,
  MAX_EXPORT_AREA_PX,
  MAX_EXPORT_BASENAME_LENGTH,
  MAX_EXPORT_SIDE_PX,
  MIN_FRAME_SCREEN_PX,
  TOOLBAR_GAP_PX,
  TOOLBAR_MARGIN_PX
} from "../consts"

/** The axis-aligned box between two drag points, whichever way the drag went. */
export function normaliseBox(origin: VecLike, current: VecLike): BoxModel {
  return {
    x: Math.min(origin.x, current.x),
    y: Math.min(origin.y, current.y),
    w: Math.abs(current.x - origin.x),
    h: Math.abs(current.y - origin.y)
  }
}

/** The keyboard-created frame, in page space, centred in the viewport's page bounds. */
export function defaultFrameBox(viewport: BoxModel, zoom: number): BoxModel {
  const w = Math.min(
    DEFAULT_FRAME_SCREEN_PX.w / zoom,
    viewport.w * DEFAULT_FRAME_MAX_VIEWPORT_SHARE
  )
  const h = Math.min(
    DEFAULT_FRAME_SCREEN_PX.h / zoom,
    viewport.h * DEFAULT_FRAME_MAX_VIEWPORT_SHARE
  )
  return { x: viewport.x + (viewport.w - w) / 2, y: viewport.y + (viewport.h - h) / 2, w, h }
}

/** True only for the persistent crop-frame shape. */
export function isCropFrameShape(shape: { type: string }): shape is CropFrameShape {
  return shape.type === CROP_FRAME
}

/** Whether a page-space box is too small on screen, at this zoom, to be a frame. */
export function isBelowMinSize(box: BoxModel, zoom: number): boolean {
  return box.w * zoom < MIN_FRAME_SCREEN_PX || box.h * zoom < MIN_FRAME_SCREEN_PX
}

/**
 * Where a new frame goes among a page's children (sorted bottom to top): just
 * under the lowest mark, so it sits above the background but its interior
 * never covers a mark. `undefined` (on top) when there are no marks.
 */
export function frameInsertIndex(siblings: readonly FrameSibling[]): IndexKey | undefined {
  const lowestMark = siblings.findIndex(({ isMark }) => isMark)
  if (lowestMark === -1) return undefined
  return getIndexBetween(siblings[lowestMark - 1]?.index, siblings[lowestMark]?.index)
}

/**
 * The box to hand `TldrawUiContextualToolbar` as the selection, in screen
 * space. It places the toolbar above whatever box it gets; when the frame has
 * no room above it, a zero-height box below the size label moves the toolbar
 * under the label instead, if there is room there.
 */
export function cropToolbarAnchor({
  selection,
  viewport,
  toolbarHeight,
  labelHeight
}: {
  selection: BoxModel
  viewport: BoxModel
  toolbarHeight: number
  labelHeight: number
}): BoxModel {
  const top = selection.y - viewport.y
  const midY = top + selection.h / 2
  // Off screen, tldraw hides the toolbar; keep the box that makes it do so.
  if (midY < TOOLBAR_MARGIN_PX || midY > viewport.h - TOOLBAR_MARGIN_PX) return selection

  const needed = toolbarHeight + TOOLBAR_GAP_PX + TOOLBAR_MARGIN_PX
  const labelBottom = top + selection.h + labelHeight
  const hasRoomAbove = top >= needed
  const hasRoomBelow = labelBottom + needed <= viewport.h
  if (hasRoomAbove || !hasRoomBelow) return selection

  return {
    x: selection.x,
    y: selection.y + selection.h + labelHeight + toolbarHeight + TOOLBAR_GAP_PX,
    w: selection.w,
    h: 0
  }
}

function expand(box: BoxModel, slop: number): BoxModel {
  return { x: box.x - slop, y: box.y - slop, w: box.w + slop * 2, h: box.h + slop * 2 }
}

function overlapsWithArea(a: BoxModel, b: BoxModel): boolean {
  return a.x < b.x + b.w && b.x < a.x + a.w && a.y < b.y + b.h && b.y < a.y + a.h
}

/**
 * The shapes a crop renders: every candidate overlapping the frame (grown by
 * `EXPORT_EDGE_SLOP`), minus all crop frames, in the candidates' (z-)order.
 */
export function exportShapeIds(
  frame: BoxModel,
  candidates: readonly ExportCandidate[]
): TLShapeId[] {
  const region = expand(frame, EXPORT_EDGE_SLOP)
  return candidates
    .filter(
      ({ type, bounds }) =>
        type !== CROP_FRAME && bounds !== undefined && overlapsWithArea(bounds, region)
    )
    .map(({ id }) => id)
}

/**
 * 2x, unless that would push the longest side past `MAX_EXPORT_SIDE_PX` or the
 * area past `MAX_EXPORT_AREA_PX`, where browsers fail to make the canvas.
 */
export function exportPixelRatio(frame: Pick<BoxModel, "w" | "h">): number {
  const longestSide = Math.max(frame.w, frame.h)
  const area = frame.w * frame.h
  if (longestSide <= 0 || area <= 0) return EXPORT_PIXEL_RATIO
  return Math.min(
    EXPORT_PIXEL_RATIO,
    MAX_EXPORT_SIDE_PX / longestSide,
    Math.sqrt(MAX_EXPORT_AREA_PX / area)
  )
}

/** The raster size an export produces; the canvas floors fractional pixels. */
export function exportPixelSize(
  frame: Pick<BoxModel, "w" | "h">,
  pixelRatio: number
): ExportPixelSize {
  return { width: Math.floor(frame.w * pixelRatio), height: Math.floor(frame.h * pixelRatio) }
}

/** "W × H" of the raster a frame of this size exports to. */
export function exportSizeText(frame: Pick<BoxModel, "w" | "h">): string {
  const { width, height } = exportPixelSize(frame, exportPixelRatio(frame))
  return `${width} × ${height}`
}

function exportBasename(documentName: string | undefined): string {
  const base = (documentName ?? "")
    .replace(/\.[a-z0-9]+$/i, "")
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9._-]+/g, "-")
    .replace(/-{2,}/g, "-")
    .replace(/^[-.]+|[-.]+$/g, "")
    .slice(0, MAX_EXPORT_BASENAME_LENGTH)
    .replace(/[-.]+$/, "")

  return base || FALLBACK_EXPORT_BASENAME
}

const pad = (value: number) => String(value).padStart(2, "0")

/** `<document>-crop-YYYYMMDD-HHmmss`, in local time, without an extension. */
export function buildExportFilename({
  documentName,
  now
}: {
  documentName?: string
  now: Date
}): string {
  const date = `${now.getFullYear()}${pad(now.getMonth() + 1)}${pad(now.getDate())}`
  const time = `${pad(now.getHours())}${pad(now.getMinutes())}${pad(now.getSeconds())}`
  return `${exportBasename(documentName)}-crop-${date}-${time}`
}
