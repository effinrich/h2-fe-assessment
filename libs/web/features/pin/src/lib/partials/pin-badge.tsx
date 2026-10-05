import { Box } from "@h2-fe/ui"

import type { PinColors } from "../types"

/** The count of shapes a pin holds, on the pin's top-right corner. */
export function PinBadge({ colors, children }: { colors: PinColors; children: string }) {
  return (
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
      {children}
    </Box>
  )
}
