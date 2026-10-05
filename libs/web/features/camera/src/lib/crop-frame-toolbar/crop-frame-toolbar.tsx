import { useEditor } from "tldraw"

import { CropFrameToolbarContent } from "./crop-frame-toolbar-content"
import { useCropFrameToolbarTarget } from "./hooks"

/** Export actions beside the selected crop frame (the `InFrontOfTheCanvas` slot). */
export function CropFrameToolbar({ documentName }: { documentName?: string }) {
  const editor = useEditor()
  const frameId = useCropFrameToolbarTarget(editor)
  if (!frameId) return null
  return <CropFrameToolbarContent key={frameId} frameId={frameId} documentName={documentName} />
}
