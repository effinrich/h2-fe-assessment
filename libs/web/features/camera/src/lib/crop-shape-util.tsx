import { BaseBoxShapeUtil, T, type RecordProps, type TLShape } from "tldraw"

export const CROP_TYPE = "crop"

declare module "tldraw" {
  export interface TLGlobalShapePropsMap {
    [CROP_TYPE]: { w: number; h: number }
  }
}

export type CropShape = TLShape<typeof CROP_TYPE>

// The length of each corner bracket, in canvas units.
const BRACKET = 20

// The brackets have to read at the zoom the document is usually read at, so
// they are drawn heavier than a hairline.
const STROKE = 3

/** The four corner brackets, as one path. */
function brackets(w: number, h: number) {
  const b = Math.min(BRACKET, w / 2, h / 2)
  return [
    `M 0 ${b} L 0 0 L ${b} 0`,
    `M ${w - b} 0 L ${w} 0 L ${w} ${b}`,
    `M ${w} ${h - b} L ${w} ${h} L ${w - b} ${h}`,
    `M ${b} ${h} L 0 ${h} L 0 ${h - b}`
  ].join(" ")
}

/**
 * The crop: a region of the canvas, drawn as corner brackets.
 *
 * It is a shape rather than a gesture, so it can be adjusted and exported
 * again. The geometry is filled so the region can be grabbed and moved, but
 * the shape draws nothing but brackets, so what it frames stays visible.
 */
export class CropShapeUtil extends BaseBoxShapeUtil<CropShape> {
  static override type = CROP_TYPE
  static override props: RecordProps<CropShape> = {
    w: T.number,
    h: T.number
  }

  override getDefaultProps() {
    return { w: 200, h: 200 }
  }

  // A crop is a region, not a picture of one, so there is nothing to rotate.
  override hideRotateHandle() {
    return true
  }

  override component(shape: CropShape) {
    const { w, h } = shape.props
    return (
      <svg width={w} height={h}>
        <path
          d={brackets(w, h)}
          fill="none"
          stroke="var(--tl-color-text-1)"
          strokeWidth={STROKE}
          strokeLinecap="square"
        />
      </svg>
    )
  }

  override getIndicatorPath(shape: CropShape) {
    const path = new Path2D()
    path.rect(0, 0, shape.props.w, shape.props.h)
    return path
  }

  // The export carries the colour mode's background, so the brackets take the
  // colour the text would take in the same mode.
  override toSvg(shape: CropShape) {
    const { w, h } = shape.props
    const dark = this.editor.getColorMode() === "dark"
    return (
      <path
        d={brackets(w, h)}
        fill="none"
        stroke={dark ? "#f5f5f5" : "#1d1d1d"}
        strokeWidth={STROKE}
        strokeLinecap="square"
      />
    )
  }
}
