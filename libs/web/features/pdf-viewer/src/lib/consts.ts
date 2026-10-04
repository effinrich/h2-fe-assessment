import type { TLUiOverrides } from "tldraw"

export const PDF_PAGE_GAP = 40

export const PDF_PAGE_SHAPE_ID = /^shape:page-\d+$/

export const PDF_PAGE_ASSET_ID = /^asset:page-(\d+)-/

export const DOCUMENT_TOOLS_LABEL = "shortcuts-dialog.document-tools"

export const VIEWER_OVERRIDES: TLUiOverrides = {
  translations: { en: { [DOCUMENT_TOOLS_LABEL]: "Document tools" } }
}
