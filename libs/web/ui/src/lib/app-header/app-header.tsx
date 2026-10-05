import type { ReactNode } from "react"

import { Scan } from "lucide-react"

import { chakra, Icon, Text } from "@h2-fe/ui"

interface AppHeaderProps {
  /** Beside the brand: what this screen is about (e.g. the open file). */
  start?: ReactNode
  /** Centred in the bar. */
  children?: ReactNode
  /** Trailing actions. */
  end?: ReactNode
}

// The app's one chrome row. It sits in the page flow, above whatever surface
// fills the rest of the screen, so it never shares a pixel with canvas UI.
const Bar = chakra("header", {
  base: {
    alignItems: "center",
    bg: "bg.panel",
    borderBottomWidth: "1px",
    borderColor: "border",
    color: "fg",
    columnGap: { base: "2", md: "4" },
    display: "grid",
    flexShrink: "0",
    gridTemplateColumns: {
      base: "minmax(0, 1fr) auto auto",
      md: "minmax(0, 1fr) auto minmax(0, 1fr)"
    },
    minH: "12",
    px: { base: "3", md: "4" },
    py: "2"
  }
})

const Start = chakra("div", {
  base: { alignItems: "center", display: "flex", gap: "3", minW: "0" }
})

const End = chakra("div", {
  base: { alignItems: "center", display: "flex", gap: "1", justifySelf: "end" }
})

const Mark = chakra("span", {
  base: {
    alignItems: "center",
    bg: "brand.solid",
    borderRadius: "md",
    color: "brand.contrast",
    display: "inline-flex",
    flexShrink: "0",
    h: "7",
    justifyContent: "center",
    w: "7"
  }
})

export function AppHeader({ start, children, end }: AppHeaderProps) {
  return (
    <Bar>
      <Start>
        <Mark aria-hidden>
          <Icon asChild boxSize="4">
            <Scan strokeWidth={2.25} />
          </Icon>
        </Mark>
        <Text
          as="span"
          fontSize="sm"
          fontWeight="semibold"
          hideBelow={start ? "md" : undefined}
          letterSpacing="-0.01em"
        >
          Annotate
        </Text>
        {start}
      </Start>
      <div>{children}</div>
      <End>{end}</End>
    </Bar>
  )
}
