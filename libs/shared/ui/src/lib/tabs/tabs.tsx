import { Tabs as ChakraTabs } from "@chakra-ui/react";
import type { ReactNode } from "react";

export interface TabsItemData {
  value: string;
  label: ReactNode;
  content: ReactNode;
  disabled?: boolean;
}

export interface TabsProps extends Omit<ChakraTabs.RootProps, "children" | "onValueChange"> {
  items: TabsItemData[];
  onValueChange?: (value: string) => void;
}

/** Opens on the first tab unless `value` or `defaultValue` says otherwise. */
export function Tabs({ items, value, defaultValue, onValueChange, ...rootProps }: TabsProps) {
  return (
    <ChakraTabs.Root
      {...rootProps}
      value={value}
      defaultValue={value === undefined ? (defaultValue ?? items[0]?.value) : undefined}
      onValueChange={(details) => onValueChange?.(details.value)}
    >
      <ChakraTabs.List>
        {items.map((item) => (
          <ChakraTabs.Trigger key={item.value} value={item.value} disabled={item.disabled}>
            {item.label}
          </ChakraTabs.Trigger>
        ))}
      </ChakraTabs.List>
      {items.map((item) => (
        <ChakraTabs.Content key={item.value} value={item.value}>
          {item.content}
        </ChakraTabs.Content>
      ))}
    </ChakraTabs.Root>
  );
}
