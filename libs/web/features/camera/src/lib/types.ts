import type { ComponentType } from "react"
import type {
  BoxModel,
  IndexKey,
  TLAnyShapeUtilConstructor,
  TLShape,
  TLShapeId,
  TLStateNodeConstructor,
  TLUiOverrides
} from "tldraw"

export interface CameraExtensionOptions {
  /** The open document's filename; exports are named after it. */
  documentName?: string
}

/**
 * Structurally a `CanvasExtension` (`@h2-fe/pdf-viewer`), which a sibling
 * feature lib can't import. Also mountable on a plain `<Tldraw>`.
 */
export interface CameraExtension {
  toolIds: readonly string[]
  shapeUtils: readonly TLAnyShapeUtilConstructor[]
  tools: readonly TLStateNodeConstructor[]
  overrides: TLUiOverrides
  InFrontOfTheCanvas: ComponentType
}

export interface CropFrameShapeProps {
  w: number
  h: number
}

declare module "tldraw" {
  interface TLGlobalShapePropsMap {
    "crop-frame": CropFrameShapeProps
  }
}

export type CropFrameShape = TLShape<"crop-frame">

export type ExportFormat = "png" | "svg"

export type CropAction = "download-png" | "copy-png" | "download-svg"

export interface CropActionJob {
  frameId: TLShapeId
  action: CropAction
}

export interface CropActionState {
  busy: CropActionJob | null
  done: CropActionJob | null
}

/** A page shape as the export filter sees it: z-ordered, with page bounds. */
export interface ExportCandidate {
  id: TLShapeId
  type: string
  bounds: BoxModel | undefined
}

/** A page child as frame stacking sees it: a mark is unlocked user content. */
export interface FrameSibling {
  index: IndexKey
  isMark: boolean
}

export interface ExportPixelSize {
  width: number
  height: number
}
