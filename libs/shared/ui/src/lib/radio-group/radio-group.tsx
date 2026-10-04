import { RadioGroup as ChakraRadioGroup, Stack } from '@chakra-ui/react'
import type { ReactNode } from 'react'

export interface RadioGroupOption {
  value: string
  label: ReactNode
  disabled?: boolean
}

export interface RadioGroupProps extends Omit<
  ChakraRadioGroup.RootProps,
  'children' | 'onValueChange'
> {
  items: RadioGroupOption[]
  label?: ReactNode
  /** `null` when the selection is cleared. */
  onValueChange?: (value: string | null) => void
}

export function RadioGroup({
  items,
  label,
  onValueChange,
  orientation = 'vertical',
  ...rootProps
}: RadioGroupProps) {
  return (
    <ChakraRadioGroup.Root
      {...rootProps}
      orientation={orientation}
      onValueChange={details => onValueChange?.(details.value)}
    >
      {label ? <ChakraRadioGroup.Label>{label}</ChakraRadioGroup.Label> : null}
      <Stack
        direction={orientation === 'horizontal' ? 'row' : 'column'}
        gap="3"
        mt={label ? '2' : undefined}
      >
        {items.map(item => (
          <ChakraRadioGroup.Item key={item.value} value={item.value} disabled={item.disabled}>
            <ChakraRadioGroup.ItemHiddenInput />
            <ChakraRadioGroup.ItemIndicator />
            <ChakraRadioGroup.ItemText>{item.label}</ChakraRadioGroup.ItemText>
          </ChakraRadioGroup.Item>
        ))}
      </Stack>
    </ChakraRadioGroup.Root>
  )
}
