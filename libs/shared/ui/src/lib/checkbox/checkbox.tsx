import type { ReactNode } from "react"

import { Checkbox as ChakraCheckbox } from "@chakra-ui/react"

export type CheckboxCheckedState = ChakraCheckbox.CheckedChangeDetails["checked"]

export interface CheckboxProps extends Omit<ChakraCheckbox.RootProps, "onCheckedChange"> {
  /** The checkbox's label. */
  children?: ReactNode
  onCheckedChange?: (checked: CheckboxCheckedState) => void
}

export function Checkbox({ children, onCheckedChange, ...rootProps }: CheckboxProps) {
  return (
    <ChakraCheckbox.Root
      {...rootProps}
      onCheckedChange={(details) => onCheckedChange?.(details.checked)}
    >
      <ChakraCheckbox.HiddenInput />
      <ChakraCheckbox.Control>
        <ChakraCheckbox.Indicator />
      </ChakraCheckbox.Control>
      {children != null ? <ChakraCheckbox.Label>{children}</ChakraCheckbox.Label> : null}
    </ChakraCheckbox.Root>
  )
}
