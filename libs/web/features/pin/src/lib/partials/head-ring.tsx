import type { BoxProps } from "@h2-fe/ui"
import { Box } from "@h2-fe/ui"

import { PIN_HEAD } from "../consts"

/** A ring centred on the pin head. */
export function HeadRing({ radius, ...rest }: BoxProps & { radius: number }) {
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
