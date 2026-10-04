import type {
  TLAnyBindingUtilConstructor,
  TLAnyOverlayUtilConstructor,
  TLAnyShapeUtilConstructor,
  TLBinding,
  TLOnMountHandler,
  TLShape,
  TLShapeId,
  TLStateNodeConstructor,
  TLUiOverrides,
  VecModel
} from "tldraw"

/** Structurally a `CanvasExtension` (`@h2-fe/pdf-viewer`), which this lib can't import. */
export interface PinExtension {
  toolIds: readonly string[]
  shapeUtils: readonly TLAnyShapeUtilConstructor[]
  bindingUtils: readonly TLAnyBindingUtilConstructor[]
  tools: readonly TLStateNodeConstructor[]
  overlayUtils: readonly TLAnyOverlayUtilConstructor[]
  overrides: TLUiOverrides
  onMount: TLOnMountHandler
}

export interface PinExtensionOptions {
  /**
   * Extra eligibility rule, applied on top of the built-in one (never a pin,
   * never a frame or group, never locked).
   */
  canAttach?: CanAttach
}

export type CanAttach = (shape: TLShape) => boolean

export type PinShapeProps = Record<string, never>

export interface PinBindingProps {
  /** Held shape's page origin minus the pin point, at the last settle. */
  offset: VecModel
}

declare module "@tldraw/tlschema" {
  interface TLGlobalShapePropsMap {
    pin: PinShapeProps
  }
  interface TLGlobalBindingPropsMap {
    pin: PinBindingProps
  }
}

export type PinShape = TLShape<"pin">
export type PinBinding = TLBinding<"pin">

/** One pin binding, reduced to what the solver needs. */
export interface PinLink {
  pinId: TLShapeId
  shapeId: TLShapeId
  offset: VecModel
}

export interface AttachmentDiff {
  create: TLShapeId[]
  remove: TLShapeId[]
}

export type ShapeChange = "translate" | "reshape" | "none"

export type AncestorChange = "translate" | "rotate" | "none"

export type PinState = "free" | "holding"

/** Resolved colours for one pin, from the current tldraw theme. */
export interface PinColors {
  head: string
  stroke: string
  needle: string
  /** Applies to `stroke` and `needle`. */
  lineOpacity: number
  glint: string
  badgeBg: string
  badgeFg: string
}
