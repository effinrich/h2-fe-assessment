import { BaseBoxShapeUtil, HTMLContainer, Rectangle2d, T, type RecordProps } from "tldraw"

import type { CropFrameShape } from "./types"

import { CROP_FRAME, FRAME_STYLE } from "./consts"

/** The area an export crops to. Never rotated, never bound to, never itself exported. */
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

  override component() {
    return <HTMLContainer style={FRAME_STYLE} />
  }
}
