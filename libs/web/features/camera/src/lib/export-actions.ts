import type { Editor, TLShapeId, TLUiActionsContextType, TLUiOverrideHelpers } from "tldraw"

import type { ExportFormat } from "./types"

import { CROP_FRAME } from "./consts"

interface ExportActionSpec {
  /** "selection" falls back to the whole page when nothing is selected. */
  scope: "selection" | "page"
  kind: "export" | "copy"
  format: ExportFormat
}

const EXPORT_ACTIONS: Readonly<Record<string, ExportActionSpec>> = {
  "export-as-svg": { scope: "selection", kind: "export", format: "svg" },
  "export-as-png": { scope: "selection", kind: "export", format: "png" },
  "export-all-as-svg": { scope: "page", kind: "export", format: "svg" },
  "export-all-as-png": { scope: "page", kind: "export", format: "png" },
  "copy-as-svg": { scope: "selection", kind: "copy", format: "svg" },
  "copy-as-png": { scope: "selection", kind: "copy", format: "png" }
}

function exportIds(editor: Editor, scope: ExportActionSpec["scope"]): TLShapeId[] {
  const selected = scope === "selection" ? editor.getSelectedShapeIds() : []
  const ids = selected.length > 0 ? selected : [...editor.getCurrentPageShapeIds()]
  return ids.filter((id) => editor.getShape(id)?.type !== CROP_FRAME)
}

/**
 * tldraw's export and copy actions, minus crop frames. tldraw draws nothing for
 * a frame but still unions its bounds into the export's, so a frame in the
 * selection would pad the image with blank space. Otherwise as tldraw 5.5.0's
 * (`actions.mjs`): selection or page, and its name rule.
 */
export function withFramelessExports(
  editor: Editor,
  actions: TLUiActionsContextType,
  helpers: TLUiOverrideHelpers
): TLUiActionsContextType {
  const next = { ...actions }
  for (const [id, { scope, kind, format }] of Object.entries(EXPORT_ACTIONS)) {
    const action = actions[id]
    if (!action) continue
    next[id] = {
      ...action,
      onSelect: () => {
        const ids = exportIds(editor, scope)
        if (ids.length === 0) return
        if (kind === "copy") {
          helpers.copyAs(ids, format)
          return
        }
        const name =
          editor.getSelectedShapeIds().length === 0
            ? editor.getDocumentSettings().name || helpers.msg("document.default-name")
            : undefined
        helpers.exportAs(ids, name === undefined ? { format } : { format, name })
      }
    }
  }
  return next
}
