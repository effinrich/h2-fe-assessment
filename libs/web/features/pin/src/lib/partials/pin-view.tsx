import type { TLShapeId } from "tldraw"

import { HTMLContainer } from "tldraw"

import { Box } from "@h2-fe/ui"

import type { PinColors, PinState } from "../types"

import { PIN_SIZE, PIN_TIP } from "../consts"
import { AttachRings } from "./attach-rings"
import { PinBadge } from "./pin-badge"
import { PinGlyph } from "./pin-glyph"

interface PinViewProps {
  id: TLShapeId
  state: PinState
  colors: PinColors
  badge: string | null
  attaching: boolean
  /** Glyph and ring scale about the tip; see `glyphScale`. */
  scale: number
}

/** The pin on the canvas, in page units: glyph, attach rings and count badge. */
export function PinView({ id, state, colors, badge, attaching, scale }: PinViewProps) {
  return (
    <Box
      asChild
      data-pin-id={id}
      data-state={state}
      data-attaching={attaching || undefined}
      w={`${PIN_SIZE.w}px`}
      h={`${PIN_SIZE.h}px`}
      overflow="visible"
    >
      <HTMLContainer>
        <Box
          position="absolute"
          inset="0"
          transform={scale === 1 ? undefined : `scale(${scale})`}
          transformOrigin={`${PIN_TIP.x}px ${PIN_TIP.y}px`}
        >
          {attaching && <AttachRings stroke={colors.stroke} />}
          <svg
            width={PIN_SIZE.w}
            height={PIN_SIZE.h}
            viewBox={`0 0 ${PIN_SIZE.w} ${PIN_SIZE.h}`}
            overflow="visible"
            aria-hidden
          >
            <PinGlyph colors={colors} />
          </svg>
        </Box>
        {badge && <PinBadge colors={colors}>{badge}</PinBadge>}
      </HTMLContainer>
    </Box>
  )
}
