import { createListCollection, Portal, Select as ChakraSelect } from '@chakra-ui/react'
import { type ReactNode, useMemo } from 'react'

export interface SelectOption {
  value: string
  label: string
  disabled?: boolean
}

export interface SelectProps extends Omit<
  ChakraSelect.RootProps<SelectOption>,
  'collection' | 'children' | 'onValueChange'
> {
  items: SelectOption[]
  label?: ReactNode
  placeholder?: string
  /** Selected values; holds at most one entry unless `multiple` is set. */
  onValueChange?: (value: string[]) => void
}

export function Select({
  items,
  label,
  placeholder,
  onValueChange,
  positioning,
  ...rootProps
}: SelectProps) {
  const collection = useMemo(() => createListCollection({ items }), [items])

  return (
    <ChakraSelect.Root
      {...rootProps}
      collection={collection}
      positioning={{ sameWidth: true, ...positioning }}
      onValueChange={details => onValueChange?.(details.value)}
    >
      <ChakraSelect.HiddenSelect />
      {label ? <ChakraSelect.Label>{label}</ChakraSelect.Label> : null}
      <ChakraSelect.Control>
        <ChakraSelect.Trigger>
          <ChakraSelect.ValueText placeholder={placeholder} />
        </ChakraSelect.Trigger>
        <ChakraSelect.IndicatorGroup>
          <ChakraSelect.Indicator />
        </ChakraSelect.IndicatorGroup>
      </ChakraSelect.Control>
      <Portal>
        <ChakraSelect.Positioner>
          <ChakraSelect.Content>
            {collection.items.map(item => (
              <ChakraSelect.Item key={item.value} item={item}>
                {item.label}
                <ChakraSelect.ItemIndicator />
              </ChakraSelect.Item>
            ))}
          </ChakraSelect.Content>
        </ChakraSelect.Positioner>
      </Portal>
    </ChakraSelect.Root>
  )
}
