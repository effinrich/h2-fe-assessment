import {
  DefaultKeyboardShortcutsDialog,
  DefaultKeyboardShortcutsDialogContent,
  TldrawUiMenuGroup,
  TldrawUiMenuToolItem,
  type TLUiKeyboardShortcutsDialogProps
} from "tldraw"

import { DOCUMENT_TOOLS_LABEL } from "../consts"
import { ToolbarSlot } from "./viewer-chrome"

/** tldraw's shortcuts dialog with a "document tools" group for the extensions' tools. */
export function createViewerKeyboardShortcutsDialog(toolIds: readonly string[]) {
  return function ViewerKeyboardShortcutsDialog(props: TLUiKeyboardShortcutsDialogProps) {
    return (
      <ToolbarSlot>
        <DefaultKeyboardShortcutsDialog {...props}>
          <TldrawUiMenuGroup id="document-tools" label={DOCUMENT_TOOLS_LABEL}>
            {toolIds.map((toolId) => (
              <TldrawUiMenuToolItem key={toolId} toolId={toolId} />
            ))}
          </TldrawUiMenuGroup>
          <DefaultKeyboardShortcutsDialogContent />
        </DefaultKeyboardShortcutsDialog>
      </ToolbarSlot>
    )
  }
}
