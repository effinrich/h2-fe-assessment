import { HTMLContainer, useEditor, useValue } from "tldraw"

import { Box } from "@h2-fe/ui"

import type { CropFrameShape } from "../types"

import { exportSizeText } from "../utils/utils"
import { CropFrameOutline } from "./crop-frame-outline"

export function CropFrame({ shape }: { shape: CropFrameShape }) {
  const editor = useEditor()
  const zoom = useValue("crop frame zoom", () => editor.getZoomLevel(), [editor])
  // tldraw's colour mode can differ from the app's; scope the tokens to it.
  const colorMode = useValue("crop frame colour mode", () => editor.getColorMode(), [editor])
  const isSelected = useValue(
    "crop frame selected",
    () => editor.getSelectedShapeIds().includes(shape.id),
    [editor, shape.id]
  )
  const isHovered = useValue("crop frame hovered", () => editor.getHoveredShapeId() === shape.id, [
    editor,
    shape.id
  ])

  return (
    <Box asChild className={colorMode}>
      <HTMLContainer>
        <CropFrameOutline
          w={shape.props.w}
          h={shape.props.h}
          unit={1 / zoom}
          label={`${exportSizeText(shape.props)} PNG`}
          selected={isSelected}
          revealLabel={isHovered}
          colorMode={colorMode}
        />
      </HTMLContainer>
    </Box>
  )
}
