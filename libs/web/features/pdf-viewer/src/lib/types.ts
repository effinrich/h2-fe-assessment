import type { ComponentType } from "react"
import type {
  TLAnyBindingUtilConstructor,
  TLAnyOverlayUtilConstructor,
  TLAnyShapeUtilConstructor,
  TLOnMountHandler,
  TLStateNodeConstructor,
  TLUiOverrides
} from "tldraw"

export interface PdfPage {
  pageNumber: number
  width: number
  height: number
}

export interface RenderedPdfPage extends PdfPage {
  dataUrl: string
}

export interface PdfDocumentSummary {
  pages: PdfPage[]
  renderPages: (pageNumbers: number[]) => Promise<RenderedPdfPage[]>
  destroy: () => Promise<void>
}

export type FileToken = string

export interface PageOverlay {
  page: number
  state: "loading" | "error"
  style: { left: number; top: number; width: number; height: number }
}

/**
 * Editor capabilities a feature contributes to the viewer's canvas. Create
 * extensions once (module scope or `useMemo`): tldraw expects stable utils.
 */
export interface CanvasExtension {
  /** Tools to list in the toolbar and shortcuts dialog; each must be defined by `overrides.tools`. */
  toolIds?: readonly string[]
  shapeUtils?: readonly TLAnyShapeUtilConstructor[]
  bindingUtils?: readonly TLAnyBindingUtilConstructor[]
  tools?: readonly TLStateNodeConstructor[]
  overlayUtils?: readonly TLAnyOverlayUtilConstructor[]
  overrides?: TLUiOverrides
  InFrontOfTheCanvas?: ComponentType
  onMount?: TLOnMountHandler
}

export interface MergedCanvasExtensions {
  toolIds: readonly string[]
  shapeUtils: readonly TLAnyShapeUtilConstructor[]
  bindingUtils: readonly TLAnyBindingUtilConstructor[]
  tools: readonly TLStateNodeConstructor[]
  overlayUtils: readonly TLAnyOverlayUtilConstructor[]
  overrides: TLUiOverrides[]
  inFrontOfTheCanvas: readonly ComponentType[]
  onMount: readonly TLOnMountHandler[]
}

export interface PdfViewerScreenProps {
  filename?: string
  onMarksChange?: (hasMarks: boolean) => void
  document?: PdfDocumentSummary
  isLoading?: boolean
  isError?: boolean
  onRetry?: () => void
  onOpenAnother: () => void
  extensions?: readonly CanvasExtension[]
}
