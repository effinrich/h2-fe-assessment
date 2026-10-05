import { DefaultToolbar, DefaultToolbarContent, ToolbarItem } from "tldraw"

import { PIN_TOOL_ID } from "./consts"

/** The toolbar slot the viewer renders for extension tools, with the pin first. */
export function PinStoryToolbar() {
  return (
    <DefaultToolbar>
      <ToolbarItem tool={PIN_TOOL_ID} />
      <DefaultToolbarContent />
    </DefaultToolbar>
  )
}
