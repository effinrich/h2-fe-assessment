import { HStack, Kbd } from "@h2-fe/ui"

import { TOOL_HINTS } from "../consts"

/** What the canvas is for, by shortcut. */
export function HomeToolHints() {
  return (
    <HStack
      aria-label="Tools on the canvas"
      as="ul"
      color="fg.muted"
      alignItems="start"
      columnGap="6"
      direction={{ base: "column", lg: "row" }}
      flexWrap="wrap"
      justify="start"
      listStyle="none"
      rowGap="3"
      textStyle="sm"
    >
      {TOOL_HINTS.map(({ key, label }) => (
        <HStack as="li" gap="2" key={key}>
          <Kbd size="sm">{key}</Kbd>
          {label}
        </HStack>
      ))}
    </HStack>
  )
}
