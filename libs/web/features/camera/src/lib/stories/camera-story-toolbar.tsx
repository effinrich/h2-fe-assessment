import { DefaultToolbar, DefaultToolbarContent, ToolbarItem } from "tldraw"

import { CAMERA_TOOL_ID } from "../consts"

/** The toolbar slot the viewer renders for extension tools, with the camera first. */
export function CameraStoryToolbar() {
  return (
    <DefaultToolbar>
      <ToolbarItem tool={CAMERA_TOOL_ID} />
      <DefaultToolbarContent />
    </DefaultToolbar>
  )
}
