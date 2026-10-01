import { Alert as ChakraAlert } from '@chakra-ui/react';
import type { ReactElement, ReactNode } from 'react';

export interface AlertProps extends Omit<ChakraAlert.RootProps, 'title'> {
  title: ReactNode;
  /** Optional description under the title. */
  children?: ReactNode;
  /** Replaces the status icon. */
  icon?: ReactElement;
  /** Rendered at the end of the alert, e.g. a dismiss or retry button. */
  action?: ReactNode;
}

export function Alert({ title, children, icon, action, ...rootProps }: AlertProps) {
  return (
    <ChakraAlert.Root {...rootProps}>
      {icon ? <ChakraAlert.Indicator>{icon}</ChakraAlert.Indicator> : <ChakraAlert.Indicator />}
      <ChakraAlert.Content>
        <ChakraAlert.Title>{title}</ChakraAlert.Title>
        {children ? <ChakraAlert.Description>{children}</ChakraAlert.Description> : null}
      </ChakraAlert.Content>
      {action}
    </ChakraAlert.Root>
  );
}
