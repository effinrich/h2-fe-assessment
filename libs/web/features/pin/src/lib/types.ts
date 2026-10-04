import type { TLShape } from "tldraw"

export interface PinExtensionOptions {
  canAttach?: (shape: TLShape) => boolean
}
