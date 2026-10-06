import { Camera } from "lucide-react"

import type { CameraExtension, CameraExtensionOptions } from "./types"

import { CameraTool } from "./camera-tool"
import { CAMERA_KBD, CAMERA_LABEL, CAMERA_LABEL_KEY, CAMERA_TOOL_ID } from "./consts"
import { CropFrameShapeUtil } from "./crop-frame-shape-util"
import { CropFrameToolbar } from "./partials/crop-frame-toolbar"
import { CropMarquee } from "./partials/crop-marquee"

/**
 * The Export area tool and its crop frames, as a canvas extension. Create it
 * once per document (module scope or `useMemo`): tldraw expects stable utils.
 */
export function createCameraExtension({
  documentName
}: CameraExtensionOptions = {}): CameraExtension {
  function CameraInFrontOfTheCanvas() {
    return (
      <>
        <CropMarquee />
        <CropFrameToolbar documentName={documentName} />
      </>
    )
  }

  return {
    toolIds: [CAMERA_TOOL_ID],
    shapeUtils: [CropFrameShapeUtil],
    tools: [CameraTool],
    overrides: {
      tools: (editor, tools) => ({
        ...tools,
        [CAMERA_TOOL_ID]: {
          id: CAMERA_TOOL_ID,
          label: CAMERA_LABEL_KEY,
          icon: <Camera size={18} strokeWidth={1.75} />,
          kbd: CAMERA_KBD,
          onSelect: () => editor.setCurrentTool(CAMERA_TOOL_ID)
        }
      }),
      translations: { en: { [CAMERA_LABEL_KEY]: CAMERA_LABEL } }
    },
    InFrontOfTheCanvas: CameraInFrontOfTheCanvas
  }
}
