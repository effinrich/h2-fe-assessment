import { Switch as ChakraSwitch } from '@chakra-ui/react';
import type { ReactNode } from 'react';

export interface SwitchProps extends Omit<ChakraSwitch.RootProps, 'onCheckedChange'> {
  /** The switch's label. */
  children?: ReactNode;
  onCheckedChange?: (checked: boolean) => void;
}

export function Switch({ children, onCheckedChange, ...rootProps }: SwitchProps) {
  return (
    <ChakraSwitch.Root {...rootProps} onCheckedChange={(details) => onCheckedChange?.(details.checked)}>
      <ChakraSwitch.HiddenInput />
      <ChakraSwitch.Control>
        <ChakraSwitch.Thumb />
      </ChakraSwitch.Control>
      {children != null ? <ChakraSwitch.Label>{children}</ChakraSwitch.Label> : null}
    </ChakraSwitch.Root>
  );
}
