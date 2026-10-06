import type { PinColors } from "../types"

import { PIN_ART_COLLAR_PATH, PIN_ART_HEAD, PIN_ART_NEEDLE, PIN_SCALE } from "../consts"

/**
 * The pushpin itself, as plain SVG with inline colours: it is shared by the
 * canvas view and the SVG export, where no stylesheet applies.
 */
export function PinGlyph({ colors }: { colors: PinColors }) {
  return (
    <g transform={`scale(${PIN_SCALE})`} strokeLinejoin="round" strokeLinecap="round">
      <line
        x1={PIN_ART_NEEDLE.x}
        y1={PIN_ART_NEEDLE.y1}
        x2={PIN_ART_NEEDLE.x}
        y2={PIN_ART_NEEDLE.y2}
        stroke={colors.needle}
        strokeOpacity={colors.lineOpacity}
        strokeWidth={2}
      />
      <path
        d={PIN_ART_COLLAR_PATH}
        fill={colors.head}
        stroke={colors.stroke}
        strokeOpacity={colors.lineOpacity}
        strokeWidth={1.5}
      />
      <circle
        cx={PIN_ART_HEAD.cx}
        cy={PIN_ART_HEAD.cy}
        r={PIN_ART_HEAD.r - 0.75}
        fill={colors.head}
        stroke={colors.stroke}
        strokeOpacity={colors.lineOpacity}
        strokeWidth={1.5}
      />
      <circle
        cx={PIN_ART_HEAD.cx - 3}
        cy={PIN_ART_HEAD.cy - 3}
        r={2.25}
        fill={colors.glint}
        fillOpacity={0.55}
      />
    </g>
  )
}
