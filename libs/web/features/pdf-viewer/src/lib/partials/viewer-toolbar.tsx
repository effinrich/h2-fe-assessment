import { DefaultToolbar, DefaultToolbarContent, ToolbarItem } from "tldraw"

import { ToolbarSlot } from "./viewer-chrome"

/** tldraw's toolbar with the extensions' tools first. tldraw slots take no props, so `toolIds` is bound here. */
export function createViewerToolbar(toolIds: readonly string[]) {
  return function ViewerToolbar() {
    return (
      <ToolbarSlot>
        <DefaultToolbar>
          {toolIds.map((toolId) => (
            <ToolbarItem key={toolId} tool={toolId} />
          ))}
          <DefaultToolbarContent />
        </DefaultToolbar>
      </ToolbarSlot>
    )
  }
}
