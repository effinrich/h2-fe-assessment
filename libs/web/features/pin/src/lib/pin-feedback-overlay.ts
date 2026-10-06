import type { Editor } from "tldraw"

import { PinFeedbackOverlayUtil } from "./classes/pin-feedback-overlay-util"

export {
  PinFeedbackOverlayUtil,
  type PinFeedbackOverlay
} from "./classes/pin-feedback-overlay-util"

export function feedbackOf(editor: Editor): PinFeedbackOverlayUtil | undefined {
  return editor.overlays
    .getOverlayUtilsInZOrder()
    .find((util): util is PinFeedbackOverlayUtil => util instanceof PinFeedbackOverlayUtil)
}
