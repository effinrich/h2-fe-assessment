import { HStack, Kbd } from "@h2-fe/ui"

import { TOOL_HINTS } from "../consts"

/** What the canvas is for, by shortcut. */
export function HomeToolHints() {
  return (
    <HStack
      aria-label="Tools on the canvas"
      as="ul"
      color="fg.muted"
      columnGap="6"
      flexWrap="wrap"
      justify="center"
      listStyle="none"
      rowGap="2"
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
