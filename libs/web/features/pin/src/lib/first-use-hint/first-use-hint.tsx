import { useEditor, useValue } from "tldraw"

import { Box, Text } from "@h2-fe/ui"

import type { PinTool } from "../classes/pin-tool"

import { FIRST_USE_HINT, FIRST_USE_HINT_STORAGE_KEY, PIN_TOOL_ID } from "../consts"

/** Whether to show the hint on this tool entry: once per browser session. */
export function claimFirstUseHint(): boolean {
  try {
    if (sessionStorage.getItem(FIRST_USE_HINT_STORAGE_KEY)) return false
    sessionStorage.setItem(FIRST_USE_HINT_STORAGE_KEY, "1")
  } catch {
    // Storage blocked (privacy mode, sandboxed frame): show it every time.
  }
  return true
}

/** The one-line how-to shown on the tool's first use (`InFrontOfTheCanvas`). */
export function FirstUseHint() {
  const editor = useEditor()
  const colorMode = useValue("pin hint colour mode", () => editor.getColorMode(), [editor])
  const isShown = useValue(
    "pin first-use hint",
    () => editor.getStateDescendant<PinTool>(PIN_TOOL_ID)?.hint.get() ?? false,
    [editor]
  )

  return (
    <Box
      as="output"
      className={colorMode}
      position="absolute"
      top="3"
      left="50%"
      transform="translateX(-50%)"
      pointerEvents="none"
    >
      {isShown && (
        <Text
          textStyle="sm"
          whiteSpace="nowrap"
          bg="bg.panel"
          color="fg"
          px="3"
          py="1.5"
          rounded="full"
          shadow="md"
        >
          {FIRST_USE_HINT}
        </Text>
      )}
    </Box>
  )
}
