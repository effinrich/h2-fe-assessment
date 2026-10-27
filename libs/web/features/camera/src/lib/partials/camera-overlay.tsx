import { CropExport } from "./crop-export"
import { ScreenshotBox } from "./screenshot-box"

/** Everything the camera draws above the canvas: the drag box and the export control. */
export function CameraOverlay() {
  return (
    <div style={{ position: "absolute", top: 0, left: 0, pointerEvents: "none" }}>
      <ScreenshotBox />
      <CropExport />
    </div>
  )
}
