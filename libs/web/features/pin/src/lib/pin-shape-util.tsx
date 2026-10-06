import {
  Box,
  HTMLContainer,
  Rectangle2d,
  ShapeUtil,
  invLerp,
  type RecordProps,
  type TLShape,
  type TLShapeUtilCanBindOpts
} from "tldraw"

export const PIN_TYPE = "pin"

declare module "tldraw" {
  export interface TLGlobalShapePropsMap {
    [PIN_TYPE]: Record<string, never>
  }
}

export type PinShape = TLShape<typeof PIN_TYPE>

// The geometry is offset so the shape's origin (0,0) is the pin's tip: the point that binds.
// Sized for PDF pages, which are rasterised at 2x.
const SIZE = 64
const OFFSET_X = -32
const OFFSET_Y = -52

export class PinShapeUtil extends ShapeUtil<PinShape> {
  static override type = PIN_TYPE
  static override props: RecordProps<PinShape> = {}

  override getDefaultProps() {
    return {}
  }

  // Pins can't pin pins, but other bindings (arrows) can still target a pin.
  override canBind({ toShape, bindingType }: TLShapeUtilCanBindOpts<PinShape>) {
    return bindingType === PIN_TYPE ? toShape.type !== PIN_TYPE : true
  }

  override canEdit() {
    return false
  }

  override canResize() {
    return false
  }

  override hideRotateHandle() {
    return true
  }

  override isAspectRatioLocked() {
    return true
  }

  override getGeometry() {
    return new Rectangle2d({
      width: SIZE,
      height: SIZE,
      x: OFFSET_X,
      y: OFFSET_Y,
      isFilled: true
    })
  }

  override component() {
    return (
      <HTMLContainer
        style={{
          marginLeft: OFFSET_X,
          marginTop: OFFSET_Y,
          width: SIZE,
          height: SIZE,
          fontSize: SIZE * 0.8,
          lineHeight: `${SIZE}px`,
          textAlign: "center"
        }}
      >
        📍
      </HTMLContainer>
    )
  }

  override toSvg() {
    return (
      <text x={OFFSET_X} y={OFFSET_Y + SIZE * 0.8} fontSize={SIZE * 0.8}>
        📍
      </text>
    )
  }

  override getIndicatorPath() {
    const path = new Path2D()
    path.rect(OFFSET_X, OFFSET_Y, SIZE, SIZE)
    return path
  }

  // Dragging a pin unpins it; dropping it pins every unlocked shape under its tip.
  override onTranslateStart(shape: PinShape) {
    this.editor.deleteBindings(this.editor.getBindingsFromShape(shape, PIN_TYPE))
  }

  override onTranslateEnd(_initial: PinShape, pin: PinShape) {
    const tip = this.editor.getShapePageTransform(pin).applyToPoint({ x: 0, y: 0 })
    const targets = this.editor
      .getShapesAtPoint(tip, { hitInside: true })
      .filter(
        (shape) =>
          !shape.isLocked &&
          shape.parentId === pin.parentId &&
          shape.index < pin.index &&
          this.editor.canBindShapes({ fromShape: pin, toShape: shape, binding: PIN_TYPE })
      )

    for (const target of targets) {
      const bounds = Box.ZeroFix(this.editor.getShapeGeometry(target).bounds)
      const point = this.editor.getPointInShapeSpace(target, tip)
      this.editor.createBinding({
        type: PIN_TYPE,
        fromId: pin.id,
        toId: target.id,
        props: {
          // Normalised within the target's bounds, so the pin keeps its spot through a resize.
          anchor: {
            x: invLerp(bounds.minX, bounds.maxX, point.x),
            y: invLerp(bounds.minY, bounds.maxY, point.y)
          }
        }
      })
    }
  }
}
