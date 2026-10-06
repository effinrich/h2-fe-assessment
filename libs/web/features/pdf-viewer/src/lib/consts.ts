import type { TLUiOverrides } from "tldraw"

export const PDF_PAGE_GAP = 40

/**
 * `zoomToBounds` inset for the first page, as a share of the viewport width:
 * 90% wide on a phone. tldraw subtracts the inset once from each axis, so it
 * is the total margin, not a per-side one.
 */
export const FIT_INSET_SHARE = 0.1

export const CANVAS_THEME_CLASS = "h2-canvas-theme"

export const PDF_PAGE_SHAPE_ID = /^shape:page-\d+$/

export const PDF_PAGE_ASSET_ID = /^asset:page-(\d+)-/

export const DOCUMENT_TOOLS_LABEL = "shortcuts-dialog.document-tools"

export const VIEWER_OVERRIDES: TLUiOverrides = {
  translations: { en: { [DOCUMENT_TOOLS_LABEL]: "Document tools" } }
}
