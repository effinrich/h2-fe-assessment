import type { ReactElement, ReactNode } from "react"

import { Portal, Tooltip as ChakraTooltip } from "@chakra-ui/react"

export interface TooltipProps extends Omit<ChakraTooltip.RootProps, "children"> {
  content: ReactNode
  /** A single focusable element; the tooltip attaches to it rather than wrapping it. */
  children: ReactElement
  showArrow?: boolean
}

export function Tooltip({
  content,
  children,
  showArrow = false,
  disabled,
  ...rootProps
}: TooltipProps) {
  if (disabled) return children

  return (
    <ChakraTooltip.Root {...rootProps}>
      <ChakraTooltip.Trigger asChild>{children}</ChakraTooltip.Trigger>
      <Portal>
        <ChakraTooltip.Positioner>
          <ChakraTooltip.Content>
            {showArrow ? (
              <ChakraTooltip.Arrow>
                <ChakraTooltip.ArrowTip />
              </ChakraTooltip.Arrow>
            ) : null}
            {content}
          </ChakraTooltip.Content>
        </ChakraTooltip.Positioner>
      </Portal>
    </ChakraTooltip.Root>
  )
}
