import type { TLUiOverrides } from "tldraw"

import { Camera } from "lucide-react"

import { CAMERA_TOOL_ID, CameraTool } from "./camera-tool"
import { ScreenshotBox } from "./partials/screenshot-box"

const LABEL_KEY = "tool.camera"

const overrides: TLUiOverrides = {
  tools: (editor, tools) => ({
    ...tools,
    [CAMERA_TOOL_ID]: {
      id: CAMERA_TOOL_ID,
      label: LABEL_KEY,
      icon: <Camera size={18} strokeWidth={1.75} />,
      kbd: "c",
      onSelect: () => editor.setCurrentTool(CAMERA_TOOL_ID)
    }
  }),
  translations: { en: { [LABEL_KEY]: "Screenshot" } }
}

/** The screenshot tool (`C`) for a tldraw canvas. */
export const cameraExtension = {
  toolIds: [CAMERA_TOOL_ID],
  tools: [CameraTool],
  overrides,
  InFrontOfTheCanvas: ScreenshotBox
}
