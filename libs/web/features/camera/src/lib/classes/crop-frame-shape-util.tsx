import { BaseBoxShapeUtil, Rectangle2d, T, type RecordProps } from "tldraw"

import type { CropFrameShape } from "../types"

import { CROP_FRAME } from "../consts"
import { CropFrameView } from "../crop-frame/partials/crop-frame-view"
import { exportSizeText } from "../utils/utils"

/**
 * A crop region: resizable, never rotated, never bound to, and absent from
 * every export, its own and tldraw's.
 */
export class CropFrameShapeUtil extends BaseBoxShapeUtil<CropFrameShape> {
  static override type = CROP_FRAME
  static override props: RecordProps<CropFrameShape> = {
    w: T.nonZeroNumber,
    h: T.nonZeroNumber
  }

  override getDefaultProps(): CropFrameShape["props"] {
    return { w: 300, h: 200 }
  }

  override canBind() {
    return false
  }

  override canEdit() {
    return false
  }

  override hideRotateHandle() {
    return true
  }

  // Exports crop to axis-aligned page bounds, so a rotation (from the API, or
  // rotating a mixed selection) would make the frame lie about its crop.
  override onBeforeUpdate(prev: CropFrameShape, next: CropFrameShape) {
    if (next.rotation === 0) return undefined
    return { ...next, rotation: 0, x: prev.x, y: prev.y }
  }

  // Filled, so a click on empty space inside selects it; frames are inserted
  // under the marks, which keep winning clicks on themselves.
  override getGeometry(shape: CropFrameShape) {
    return new Rectangle2d({ width: shape.props.w, height: shape.props.h, isFilled: true })
  }

  override getIndicatorPath(shape: CropFrameShape) {
    const path = new Path2D()
    path.rect(0, 0, shape.props.w, shape.props.h)
    return path
  }

  override toSvg() {
    return null
  }

  override getAriaDescriptor(shape: CropFrameShape) {
    return `Exports at ${exportSizeText(shape.props)} px`
  }

  override component(shape: CropFrameShape) {
    return <CropFrameView shape={shape} />
  }
}
