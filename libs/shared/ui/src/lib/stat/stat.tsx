import type { ReactNode } from "react"

import { Badge, Stat as ChakraStat } from "@chakra-ui/react"

export interface StatTrend {
  direction: "up" | "down"
  value: ReactNode
}

export interface StatProps extends ChakraStat.RootProps {
  label: ReactNode
  value: ReactNode
  unit?: ReactNode
  helpText?: ReactNode
  /** Rendered as a green (up) or red (down) badge after the value. */
  trend?: StatTrend
}

// Stat.Root is a <dl>: its direct children must be <dt>/<dd>, so the trend
// badge lives inside the value's <dd> and the help text renders as a <dd>.
export function Stat({ label, value, unit, helpText, trend, ...rootProps }: StatProps) {
  return (
    <ChakraStat.Root {...rootProps}>
      <ChakraStat.Label>{label}</ChakraStat.Label>
      <ChakraStat.ValueText alignItems="center" gap="2">
        <span>
          {value}
          {unit ? <ChakraStat.ValueUnit ms="1">{unit}</ChakraStat.ValueUnit> : null}
        </span>
        {trend ? (
          <Badge colorPalette={trend.direction === "up" ? "green" : "red"} gap="0">
            {trend.direction === "up" ? <ChakraStat.UpIndicator /> : <ChakraStat.DownIndicator />}
            {trend.value}
          </Badge>
        ) : null}
      </ChakraStat.ValueText>
      {helpText ? (
        <ChakraStat.HelpText asChild>
          <dd>{helpText}</dd>
        </ChakraStat.HelpText>
      ) : null}
    </ChakraStat.Root>
  )
}
