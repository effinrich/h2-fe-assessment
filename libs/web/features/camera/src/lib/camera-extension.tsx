import type { TLUiOverrides } from "tldraw"

import { Crop } from "lucide-react"

import { CAMERA_TOOL_ID, CameraTool } from "./camera-tool"
import { CROP_TYPE, CropShapeUtil } from "./crop-shape-util"
import { CameraOverlay } from "./partials/camera-overlay"

const LABEL_KEY = "tool.camera"

const overrides: TLUiOverrides = {
  tools: (editor, tools) => ({
    ...tools,
    [CAMERA_TOOL_ID]: {
      id: CAMERA_TOOL_ID,
      label: LABEL_KEY,
      icon: <Crop size={18} strokeWidth={1.75} />,
      kbd: "c",
      onSelect: () => editor.setCurrentTool(CAMERA_TOOL_ID)
    }
  }),
  translations: { en: { [LABEL_KEY]: "Crop" } }
}

/** The camera tool (`C`) for a tldraw canvas: drag out a crop, then export it. */
export const cameraExtension = {
  toolIds: [CAMERA_TOOL_ID],
  shapeUtils: [CropShapeUtil],
  tools: [CameraTool],
  overrides,
  InFrontOfTheCanvas: CameraOverlay,
  // The crop is a frame for the canvas, not content of the document.
  nonDocumentShapeTypes: [CROP_TYPE]
}
