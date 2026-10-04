import type { ReactElement, ReactNode } from "react"

import { Popover as ChakraPopover, Portal } from "@chakra-ui/react"

export interface PopoverProps extends Omit<ChakraPopover.RootProps, "children" | "onOpenChange"> {
  /** A single element that opens the popover. */
  trigger: ReactElement
  title?: ReactNode
  children: ReactNode
  footer?: ReactNode
  showArrow?: boolean
  onOpenChange?: (open: boolean) => void
}

export function Popover({
  trigger,
  title,
  children,
  footer,
  showArrow = false,
  onOpenChange,
  ...rootProps
}: PopoverProps) {
  return (
    <ChakraPopover.Root {...rootProps} onOpenChange={(details) => onOpenChange?.(details.open)}>
      <ChakraPopover.Trigger asChild>{trigger}</ChakraPopover.Trigger>
      <Portal>
        <ChakraPopover.Positioner>
          <ChakraPopover.Content>
            {showArrow ? (
              <ChakraPopover.Arrow>
                <ChakraPopover.ArrowTip />
              </ChakraPopover.Arrow>
            ) : null}
            {title ? (
              <ChakraPopover.Header>
                <ChakraPopover.Title fontWeight="medium">{title}</ChakraPopover.Title>
              </ChakraPopover.Header>
            ) : null}
            <ChakraPopover.Body>{children}</ChakraPopover.Body>
            {footer ? <ChakraPopover.Footer>{footer}</ChakraPopover.Footer> : null}
          </ChakraPopover.Content>
        </ChakraPopover.Positioner>
      </Portal>
    </ChakraPopover.Root>
  )
}
