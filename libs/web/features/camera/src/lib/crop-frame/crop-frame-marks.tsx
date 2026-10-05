import { Box } from "@h2-fe/ui"

import { FRAME_CORNER_PX } from "../consts"

/** Path for the four L-shaped corner marks of a `w`×`h` box. */
function cornerMarksPath(w: number, h: number, length: number): string {
  return [
    `M0,${length} V0 H${length}`,
    `M${w - length},0 H${w} V${length}`,
    `M${w},${h - length} V${h} H${w - length}`,
    `M${length},${h} H0 V${h - length}`
  ].join(" ")
}

interface CropFrameMarksProps {
  w: number
  h: number
  /** Outline units per screen pixel; see `CropFrameOutline`. */
  unit: number
  selected: boolean
  colorMode: "light" | "dark"
}

/** The dashed border and corner marks of a crop frame. */
export function CropFrameMarks({ w, h, unit, selected, colorMode }: CropFrameMarksProps) {
  const px = (screenPx: number) => screenPx * unit
  const corners = cornerMarksPath(w, h, Math.min(px(FRAME_CORNER_PX), w / 3, h / 3))

  return (
    <svg width={w} height={h} overflow="visible" aria-hidden="true">
      <Box asChild stroke="bg" strokeWidth={px(3)} fill="none">
        <rect width={w} height={h} />
      </Box>
      <Box
        asChild
        stroke="brand.fg"
        strokeWidth={px(1.5)}
        strokeDasharray={`${px(6)} ${px(4)}`}
        fill="none"
      >
        <rect width={w} height={h} />
      </Box>
      <Box asChild visibility={selected ? "hidden" : undefined}>
        <g data-crop-corners="" data-corner-token={colorMode === "dark" ? "fg" : "solid"}>
          <Box asChild stroke="bg" strokeWidth={px(6)} strokeLinecap="square" fill="none">
            <path d={corners} />
          </Box>
          <Box
            asChild
            stroke={colorMode === "dark" ? "brand.fg" : "brand.solid"}
            strokeWidth={px(3)}
            strokeLinecap="square"
            fill="none"
          >
            <path d={corners} />
          </Box>
        </g>
      </Box>
    </svg>
  )
}
