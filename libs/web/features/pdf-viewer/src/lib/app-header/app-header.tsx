import type { ReactNode } from "react"

import { Scan } from "lucide-react"

import { chakra, Icon, Separator, Text } from "@h2-fe/ui"

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
// Stacked above that surface: tldraw's composited background bleeds one row
// upward and would cover the bottom stroke.
const Bar = chakra("header", {
  base: {
    position: "relative",
    zIndex: "docked",
    alignItems: "center",
    bg: "bg.panel",
    borderBottomWidth: "1px",
    borderColor: "border.emphasized",
    color: "fg",
    columnGap: { base: "2", md: "3" },
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
  // On a phone the screen's own context (the file name) gets the room.
  const brandHideBelow = start ? "md" : undefined
  return (
    <Bar>
      <Start>
        <Mark aria-hidden hideBelow={brandHideBelow}>
          <Icon asChild boxSize="4">
            <Scan strokeWidth={2.25} />
          </Icon>
        </Mark>
        <Text
          as="span"
          fontSize="sm"
          fontWeight="semibold"
          hideBelow={brandHideBelow}
          letterSpacing="-0.01em"
        >
          Annotate
        </Text>
        {start && <Separator h="5" hideBelow="md" orientation="vertical" />}
        {start}
      </Start>
      <div>{children}</div>
      <End>{end}</End>
    </Bar>
  )
}
