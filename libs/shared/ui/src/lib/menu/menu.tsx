import type { ReactElement, ReactNode } from "react"

import { Menu as ChakraMenu, Portal } from "@chakra-ui/react"

export interface MenuOption {
  value: string
  label: ReactNode
  /** Keyboard hint shown at the end of the item, e.g. "⌘E". */
  command?: string
  disabled?: boolean
  /** Styles the item as destructive. */
  danger?: boolean
}

export interface MenuProps extends Omit<ChakraMenu.RootProps, "children" | "onSelect"> {
  /** A single button element that opens the menu. */
  trigger: ReactElement
  items: MenuOption[]
  onSelect?: (value: string) => void
}

export function Menu({ trigger, items, onSelect, ...rootProps }: MenuProps) {
  return (
    <ChakraMenu.Root {...rootProps} onSelect={(details) => onSelect?.(details.value)}>
      <ChakraMenu.Trigger asChild>{trigger}</ChakraMenu.Trigger>
      <Portal>
        <ChakraMenu.Positioner>
          <ChakraMenu.Content>
            {items.map((item) => (
              <ChakraMenu.Item
                key={item.value}
                value={item.value}
                disabled={item.disabled}
                color={item.danger ? "fg.error" : undefined}
                _hover={item.danger ? { bg: "bg.error", color: "fg.error" } : undefined}
              >
                {item.label}
                {item.command ? (
                  <ChakraMenu.ItemCommand>{item.command}</ChakraMenu.ItemCommand>
                ) : null}
              </ChakraMenu.Item>
            ))}
          </ChakraMenu.Content>
        </ChakraMenu.Positioner>
      </Portal>
    </ChakraMenu.Root>
  )
}
