import {
  Circle2d,
  Group2d,
  Rectangle2d,
  ShapeUtil,
  Vec,
  type RecordProps,
  type SvgExportContext,
  type TLShapePartial,
  type TLShapeUtilCanBindOpts
} from "tldraw"

import type { PinShape, PinState } from "../types"

import {
  PIN_BINDING,
  PIN_HEAD,
  PIN_NEEDLE_HIT,
  PIN_OUTLINE_PATH,
  PIN_SHAPE,
  PIN_SIZE,
  PIN_TIP
} from "../consts"
import { PinGlyph } from "../partials/pin-glyph"
import { PinView } from "../partials/pin-view"
import { feedbackOf } from "../pin-feedback-overlay"
import { badgeLabel, glyphScale, pinColors } from "../utils"

export class PinShapeUtil extends ShapeUtil<PinShape> {
  static override type = PIN_SHAPE
  static override props: RecordProps<PinShape> = {}

  override getDefaultProps(): PinShape["props"] {
    return {}
  }

  /** Head and needle only, so clicks beside the needle still reach the shapes below. */
  override getGeometry() {
    return new Group2d({
      children: [
        new Circle2d({
          x: PIN_HEAD.cx - PIN_HEAD.r,
          y: PIN_HEAD.cy - PIN_HEAD.r,
          radius: PIN_HEAD.r,
          isFilled: true
        }),
        new Rectangle2d({
          x: PIN_NEEDLE_HIT.x,
          y: PIN_NEEDLE_HIT.y,
          width: PIN_NEEDLE_HIT.w,
          height: PIN_SIZE.h - PIN_NEEDLE_HIT.y,
          isFilled: true
        })
      ]
    })
  }

  override component(shape: PinShape) {
    const count = this.editor.getBindingsFromShape(shape, PIN_BINDING).length
    const state: PinState = count > 0 ? "holding" : "free"
    const theme = this.editor.getCurrentTheme().colors[this.editor.getColorMode()]
    return (
      <PinView
        id={shape.id}
        state={state}
        colors={pinColors(theme, state)}
        badge={badgeLabel(count)}
        attaching={feedbackOf(this.editor)?.isAttaching(shape.id) ?? false}
        scale={glyphScale(this.editor.getEfficientZoomLevel())}
      />
    )
  }

  override getIndicatorPath() {
    return new Path2D(PIN_OUTLINE_PATH)
  }

  override toSvg(shape: PinShape, ctx: SvgExportContext) {
    const holding = this.editor.getBindingsFromShape(shape, PIN_BINDING).length > 0
    const theme = this.editor.getCurrentTheme().colors[ctx.colorMode]
    return <PinGlyph colors={pinColors(theme, holding ? "holding" : "free")} />
  }

  /** Only a pin can be the `from` end of a pin binding, and never the `to` end. */
  override canBind({ fromShape, toShape, bindingType }: TLShapeUtilCanBindOpts<PinShape>) {
    if (bindingType !== PIN_BINDING) return true
    return fromShape.type === PIN_SHAPE && toShape.type !== PIN_SHAPE
  }

  /**
   * Stays upright. Alone it doesn't move at all; with other shapes its tip
   * goes where the rotation took it.
   */
  override onRotate(initial: PinShape, current: PinShape): TLShapePartial<PinShape> {
    const { x, y, rotation } = initial
    const alone = this.editor.getSelectedShapeIds().length <= 1
    if (alone) return { id: current.id, type: current.type, x, y, rotation }
    const tip = Vec.Add(current, Vec.Rot(PIN_TIP, current.rotation))
    const origin = Vec.Sub(tip, Vec.Rot(PIN_TIP, rotation))
    return { id: current.id, type: current.type, x: origin.x, y: origin.y, rotation }
  }

  override canResize() {
    return false
  }

  override hideResizeHandles() {
    return true
  }

  override hideRotateHandle() {
    return true
  }

  override hideSelectionBoundsBg() {
    return true
  }

  override hideSelectionBoundsFg() {
    return true
  }
}
