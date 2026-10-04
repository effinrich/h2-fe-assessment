import type { TLShapeId } from "tldraw"

import { HTMLContainer } from "tldraw"

import type { BoxProps } from "@h2-fe/ui"
import { Box } from "@h2-fe/ui"

import type { PinColors, PinState } from "../types"

import { ATTACH_FLASH_MS, PIN_HEAD, PIN_SIZE, PIN_TIP } from "../consts"
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

const HALO_GAP = 3
const HIDDEN = { display: "none" } as const

/** A ring centred on the pin head. */
function HeadRing({ radius, ...rest }: BoxProps & { radius: number }) {
  return (
    <Box
      position="absolute"
      left={`${PIN_HEAD.cx - radius}px`}
      top={`${PIN_HEAD.cy - radius}px`}
      boxSize={`${radius * 2}px`}
      rounded="full"
      borderWidth="2px"
      pointerEvents="none"
      {...rest}
    />
  )
}

/**
 * The pin on the canvas, in page units: glyph, count badge and, right after
 * it attaches, a ring that pings out from the head (a static halo just clear
 * of the head when the user prefers reduced motion).
 */
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
          {attaching && (
            <>
              <HeadRing
                data-ring="ping"
                radius={PIN_HEAD.r}
                borderColor={colors.stroke}
                animationName="ping"
                animationDuration={`${ATTACH_FLASH_MS}ms`}
                animationTimingFunction="cubic-bezier(0, 0, 0.2, 1)"
                animationFillMode="forwards"
                _motionReduce={HIDDEN}
              />
              <HeadRing
                data-ring="halo"
                radius={PIN_HEAD.r + HALO_GAP}
                borderColor={colors.stroke}
                opacity={0.5}
                _motionSafe={HIDDEN}
              />
            </>
          )}
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
        {badge && (
          <Box
            position="absolute"
            top="-1.5"
            right="-2.5"
            minW="4"
            h="4"
            px="1"
            rounded="full"
            borderWidth="1px"
            borderColor={colors.stroke}
            bg={colors.badgeBg}
            color={colors.badgeFg}
            fontSize="2xs"
            fontWeight="semibold"
            lineHeight="0.875rem"
            textAlign="center"
          >
            {badge}
          </Box>
        )}
      </HTMLContainer>
    </Box>
  )
}
