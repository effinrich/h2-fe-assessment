import type { ComponentType } from "react"
import type {
  TLAnyShapeUtilConstructor,
  TLShape,
  TLStateNodeConstructor,
  TLUiOverrides
} from "tldraw"

export interface CameraExtensionOptions {
  /** The open document's filename; exports are named after it. */
  documentName?: string
}

/** Structurally a `CanvasExtension` (`@h2-fe/pdf-viewer`), which a sibling feature can't import. */
export interface CameraExtension {
  toolIds: readonly string[]
  shapeUtils: readonly TLAnyShapeUtilConstructor[]
  tools: readonly TLStateNodeConstructor[]
  overrides: TLUiOverrides
  InFrontOfTheCanvas: ComponentType
}

declare module "tldraw" {
  interface TLGlobalShapePropsMap {
    "crop-frame": { w: number; h: number }
  }
}

export type CropFrameShape = TLShape<"crop-frame">

export type CropAction = "download-png" | "download-svg" | "copy-png"
