import { HStack, Progress as ChakraProgress } from "@chakra-ui/react";
import type { ReactNode } from "react";

export interface ProgressProps extends Omit<ChakraProgress.RootProps, "children"> {
  label?: ReactNode;
  /** Shows the percentage next to the label. */
  showValueText?: boolean;
}

/** Pass `value={null}` for an indeterminate bar. */
export function Progress({ label, showValueText = false, ...rootProps }: ProgressProps) {
  return (
    <ChakraProgress.Root {...rootProps}>
      {label || showValueText ? (
        <HStack justify="space-between" mb="2">
          {label ? <ChakraProgress.Label>{label}</ChakraProgress.Label> : <span />}
          {showValueText ? <ChakraProgress.ValueText /> : null}
        </HStack>
      ) : null}
      <ChakraProgress.Track>
        <ChakraProgress.Range />
      </ChakraProgress.Track>
    </ChakraProgress.Root>
  );
}
