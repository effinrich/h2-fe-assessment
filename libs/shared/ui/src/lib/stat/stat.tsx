import { Badge, HStack, Stat as ChakraStat } from "@chakra-ui/react";
import type { ReactNode } from "react";

export interface StatTrend {
  direction: "up" | "down";
  value: ReactNode;
}

export interface StatProps extends ChakraStat.RootProps {
  label: ReactNode;
  value: ReactNode;
  unit?: ReactNode;
  helpText?: ReactNode;
  /** Rendered as a green (up) or red (down) badge after the value. */
  trend?: StatTrend;
}

export function Stat({ label, value, unit, helpText, trend, ...rootProps }: StatProps) {
  return (
    <ChakraStat.Root {...rootProps}>
      <ChakraStat.Label>{label}</ChakraStat.Label>
      <HStack gap="2">
        <ChakraStat.ValueText>
          {value}
          {unit ? <ChakraStat.ValueUnit>{unit}</ChakraStat.ValueUnit> : null}
        </ChakraStat.ValueText>
        {trend ? (
          <Badge colorPalette={trend.direction === "up" ? "green" : "red"} gap="0">
            {trend.direction === "up" ? <ChakraStat.UpIndicator /> : <ChakraStat.DownIndicator />}
            {trend.value}
          </Badge>
        ) : null}
      </HStack>
      {helpText ? <ChakraStat.HelpText>{helpText}</ChakraStat.HelpText> : null}
    </ChakraStat.Root>
  );
}
