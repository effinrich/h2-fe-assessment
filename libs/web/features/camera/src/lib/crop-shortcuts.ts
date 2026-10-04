import type { Editor, TLEventInfo, TLShapeId } from "tldraw"

import { CROP_FRAME } from "./consts"
import { startCropAction } from "./crop-action-state"

function isTextEntry(element: Element | null): boolean {
  if (!(element instanceof HTMLElement)) return false
  return element.isContentEditable || element.matches("input, textarea, .tlui-slider__thumb")
}

/** The crop frame the shortcuts act on: the sole selection, with the select tool idle. */
function shortcutTarget(editor: Editor): TLShapeId | null {
  const shape = editor.getOnlySelectedShape()
  if (shape?.type !== CROP_FRAME) return null
  if (!editor.isIn("select.idle") || editor.getEditingShapeId() !== null) return null
  return shape.id
}

/**
 * Enter downloads the PNG and Ctrl/Cmd+C copies the image while a crop frame
 * is the only selection. Returns the cleanup.
 */
export function registerCropShortcuts(editor: Editor, documentName?: string): () => void {
  // Before the state chart sees it, so the Enter that drops a frame in the
  // camera tool can't also export it.
  const handleEvent = (info: TLEventInfo) => {
    if (info.type !== "keyboard" || info.name !== "key_down" || info.key !== "Enter") return
    if (info.ctrlKey || info.metaKey || info.altKey || info.shiftKey) return
    const frameId = shortcutTarget(editor)
    if (frameId) startCropAction(editor, { frameId, action: "download-png", documentName })
  }

  // Mirrors when tldraw's own copy handler (bubble phase, same document) runs,
  // so the image replaces the shape copy exactly where that would happen.
  const ownerDocument = editor.getContainer().ownerDocument
  const handleCopy = (event: ClipboardEvent) => {
    if (!editor.getInstanceState().isFocused || editor.menus.hasAnyOpenMenus()) return
    if (isTextEntry(ownerDocument.activeElement)) return
    const frameId = shortcutTarget(editor)
    if (!frameId) return
    event.preventDefault()
    event.stopImmediatePropagation()
    startCropAction(editor, { frameId, action: "copy-png", documentName })
  }

  editor.on("before-event", handleEvent)
  ownerDocument.addEventListener("copy", handleCopy, { capture: true })
  return () => {
    editor.off("before-event", handleEvent)
    ownerDocument.removeEventListener("copy", handleCopy, { capture: true })
  }
}
