import { NumberInput as ChakraNumberInput } from '@chakra-ui/react'
import type { ReactNode } from 'react'

export interface NumberInputProps extends Omit<
  ChakraNumberInput.RootProps,
  'children' | 'onValueChange'
> {
  label?: ReactNode
  placeholder?: string
  /** `valueAsNumber` is `NaN` while the input is empty. */
  onValueChange?: (valueAsNumber: number, value: string) => void
}

export function NumberInput({ label, placeholder, onValueChange, ...rootProps }: NumberInputProps) {
  return (
    <ChakraNumberInput.Root
      {...rootProps}
      onValueChange={details => onValueChange?.(details.valueAsNumber, details.value)}
    >
      {label ? <ChakraNumberInput.Label>{label}</ChakraNumberInput.Label> : null}
      <ChakraNumberInput.Control>
        <ChakraNumberInput.IncrementTrigger />
        <ChakraNumberInput.DecrementTrigger />
      </ChakraNumberInput.Control>
      <ChakraNumberInput.Input placeholder={placeholder} />
    </ChakraNumberInput.Root>
  )
}
