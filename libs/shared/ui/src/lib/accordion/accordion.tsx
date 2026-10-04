import type { ReactNode } from "react"

import { Accordion as ChakraAccordion, Span } from "@chakra-ui/react"

export interface AccordionItemData {
  value: string
  title: ReactNode
  content: ReactNode
  disabled?: boolean
}

export interface AccordionProps extends Omit<
  ChakraAccordion.RootProps,
  "children" | "onValueChange"
> {
  items: AccordionItemData[]
  /** Values of the open items. */
  onValueChange?: (value: string[]) => void
}

/** Unlike Chakra's default, an open item can be closed again (`collapsible` defaults to true). */
export function Accordion({
  items,
  onValueChange,
  collapsible = true,
  ...rootProps
}: AccordionProps) {
  return (
    <ChakraAccordion.Root
      {...rootProps}
      collapsible={collapsible}
      onValueChange={(details) => onValueChange?.(details.value)}
    >
      {items.map((item) => (
        <ChakraAccordion.Item key={item.value} value={item.value} disabled={item.disabled}>
          <ChakraAccordion.ItemTrigger>
            <Span flex="1">{item.title}</Span>
            <ChakraAccordion.ItemIndicator />
          </ChakraAccordion.ItemTrigger>
          <ChakraAccordion.ItemContent>
            <ChakraAccordion.ItemBody>{item.content}</ChakraAccordion.ItemBody>
          </ChakraAccordion.ItemContent>
        </ChakraAccordion.Item>
      ))}
    </ChakraAccordion.Root>
  )
}
