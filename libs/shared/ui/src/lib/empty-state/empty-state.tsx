import { EmptyState as ChakraEmptyState, VStack } from "@chakra-ui/react";
import type { ReactNode } from "react";

export interface EmptyStateProps extends Omit<ChakraEmptyState.RootProps, "title"> {
  title: ReactNode;
  description?: ReactNode;
  icon?: ReactNode;
  /** Actions shown under the text, e.g. a "Create" button. */
  children?: ReactNode;
}

export function EmptyState({ title, description, icon, children, ...rootProps }: EmptyStateProps) {
  return (
    <ChakraEmptyState.Root {...rootProps}>
      <ChakraEmptyState.Content>
        {icon ? <ChakraEmptyState.Indicator>{icon}</ChakraEmptyState.Indicator> : null}
        <VStack textAlign="center">
          <ChakraEmptyState.Title>{title}</ChakraEmptyState.Title>
          {description ? (
            <ChakraEmptyState.Description>{description}</ChakraEmptyState.Description>
          ) : null}
        </VStack>
        {children}
      </ChakraEmptyState.Content>
    </ChakraEmptyState.Root>
  );
}
