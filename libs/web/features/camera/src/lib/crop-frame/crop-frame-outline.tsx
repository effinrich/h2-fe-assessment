import { CropFrameLabel } from "./crop-frame-label"
import { CropFrameMarks } from "./crop-frame-marks"

interface CropFrameOutlineProps {
  w: number
  h: number
  /**
   * How many of the outline's own units make one screen pixel: `1 / zoom`
   * inside a shape (page space), 1 in screen space. The chrome stays the same
   * size on screen either way.
   */
  unit: number
  label: string
  /** tldraw's selection handles take the corners, and its blue box would clash with a brand label. */
  selected?: boolean
  /** Show the label even when the frame is narrower than it. */
  revealLabel?: boolean
  /** tldraw color mode: dark corners use `brand.fg` for contrast. */
  colorMode?: "light" | "dark"
}

/**
 * The look shared by a crop frame and the marquee that draws one: dashed
 * border, corner marks, and the size label below.
 */
export function CropFrameOutline({
  w,
  h,
  unit,
  label,
  selected = false,
  revealLabel = false,
  colorMode = "light"
}: CropFrameOutlineProps) {
  return (
    <>
      <CropFrameMarks w={w} h={h} unit={unit} selected={selected} colorMode={colorMode} />
      <CropFrameLabel
        label={label}
        w={w}
        unit={unit}
        selected={selected}
        revealLabel={revealLabel}
      />
    </>
  )
}
