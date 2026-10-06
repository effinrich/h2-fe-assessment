import type { Meta } from "@storybook/react-vite"

import { useCallback, useMemo } from "react"
import { restoreAllMocks } from "storybook/test"
import { Tldraw, type Editor, type TLComponents } from "tldraw"

import { Box, toaster } from "@h2-fe/ui"
import "tldraw/tldraw.css"

import type { CropFrameShape } from "../types"

import { createCameraExtension } from "../camera"
import { CROP_FRAME, FIRST_USE_HINT_STORAGE_KEY } from "../consts"
import { CameraStoryToolbar } from "./camera-story-toolbar"
import {
  DOCUMENT_NAME,
  FRAME_FROM,
  INSIDE_BACK,
  INSIDE_FRONT,
  OUTSIDE,
  SEEDED_FRAME
} from "./story-helpers"

interface CameraCanvasProps {
  readonly?: boolean
  colorScheme?: "light" | "dark"
  locale?: string
}

function seedShapes(editor: Editor) {
  // Created back to front: the outside rectangle sits between the two inside
  // ones in z-order, so the export filter has to skip it, not truncate.
  editor.createShapes([
    { id: INSIDE_BACK, type: "geo", x: 130, y: 130, props: { w: 100, h: 80, fill: "solid" } },
    { id: OUTSIDE, type: "geo", x: 600, y: 130, props: { w: 100, h: 80, color: "red" } },
    {
      id: INSIDE_FRONT,
      type: "geo",
      x: 260,
      y: 180,
      props: { w: 100, h: 80, fill: "solid", color: "green" }
    }
  ])
}

/** A plain `<Tldraw>` carrying the camera extension, with the slots `PdfViewerScreen` fills. */
export function CameraCanvas({
  readonly = false,
  colorScheme = "light",
  locale
}: CameraCanvasProps) {
  const extension = useMemo(() => createCameraExtension({ documentName: DOCUMENT_NAME }), [])
  const components = useMemo<TLComponents>(
    () => ({ Toolbar: CameraStoryToolbar, InFrontOfTheCanvas: extension.InFrontOfTheCanvas }),
    [extension]
  )
  const handleMount = useCallback(
    (editor: Editor) => {
      seedShapes(editor)
      if (!readonly) return
      editor.createShape<CropFrameShape>({
        id: SEEDED_FRAME,
        type: CROP_FRAME,
        ...FRAME_FROM,
        props: { w: 300, h: 200 }
      })
      editor.select(SEEDED_FRAME)
      editor.updateInstanceState({ isReadonly: true })
    },
    [readonly]
  )

  return (
    <Box position="fixed" inset="0">
      <Tldraw
        shapeUtils={extension.shapeUtils}
        tools={extension.tools}
        overrides={extension.overrides}
        components={components}
        colorScheme={colorScheme}
        locale={locale}
        onMount={handleMount}
      />
    </Box>
  )
}

/** What every camera story shares: the canvas, full-screen, and a clean slate. */
export const cameraStoryMeta = {
  component: CameraCanvas,
  parameters: { layout: "fullscreen" },
  beforeEach() {
    toaster.remove()
    sessionStorage.removeItem(FIRST_USE_HINT_STORAGE_KEY)
    return () => {
      restoreAllMocks()
      toaster.remove()
    }
  }
} satisfies Meta<typeof CameraCanvas>
