import type { ComponentType } from "react"
import type {
  TLAnyBindingUtilConstructor,
  TLAnyShapeUtilConstructor,
  TLStateNodeConstructor,
  TLUiOverrides
} from "tldraw"

export interface PdfPage {
  pageNumber: number
  width: number
  height: number
  /** The rasterised page, as a PNG data URL. */
  src: string
}

export interface PdfDocument {
  pages: PdfPage[]
}

export type FileToken = string

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
  overrides?: TLUiOverrides
  InFrontOfTheCanvas?: ComponentType
}

export interface MergedCanvasExtensions {
  toolIds: readonly string[]
  shapeUtils: readonly TLAnyShapeUtilConstructor[]
  bindingUtils: readonly TLAnyBindingUtilConstructor[]
  tools: readonly TLStateNodeConstructor[]
  overrides: TLUiOverrides[]
  inFrontOfTheCanvas: readonly ComponentType[]
}

export interface PdfViewerScreenProps {
  filename?: string
  onMarksChange?: (hasMarks: boolean) => void
  document?: PdfDocument
  isLoading?: boolean
  isError?: boolean
  onRetry?: () => void
  onOpenAnother: () => void
  extensions?: readonly CanvasExtension[]
}
