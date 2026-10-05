import type { PinColors } from "../types"

import { PIN_COLLAR_PATH, PIN_HEAD, PIN_NEEDLE } from "../consts"

/**
 * The pushpin itself, as plain SVG with inline colours: it is shared by the
 * canvas view and the SVG export, where no stylesheet applies.
 */
export function PinGlyph({ colors }: { colors: PinColors }) {
  return (
    <g strokeLinejoin="round" strokeLinecap="round">
      <line
        x1={PIN_NEEDLE.x}
        y1={PIN_NEEDLE.y1}
        x2={PIN_NEEDLE.x}
        y2={PIN_NEEDLE.y2}
        stroke={colors.needle}
        strokeOpacity={colors.lineOpacity}
        strokeWidth={2}
      />
      <path
        d={PIN_COLLAR_PATH}
        fill={colors.head}
        stroke={colors.stroke}
        strokeOpacity={colors.lineOpacity}
        strokeWidth={1.5}
      />
      <circle
        cx={PIN_HEAD.cx}
        cy={PIN_HEAD.cy}
        r={PIN_HEAD.r - 0.75}
        fill={colors.head}
        stroke={colors.stroke}
        strokeOpacity={colors.lineOpacity}
        strokeWidth={1.5}
      />
      <circle
        cx={PIN_HEAD.cx - 3}
        cy={PIN_HEAD.cy - 3}
        r={2.25}
        fill={colors.glint}
        fillOpacity={0.55}
      />
    </g>
  )
}
