import {
  DefaultKeyboardShortcutsDialog,
  DefaultKeyboardShortcutsDialogContent,
  TldrawUiMenuGroup,
  TldrawUiMenuToolItem,
  type TLUiKeyboardShortcutsDialogProps
} from "tldraw"

import { PIN_TOOL_ID } from "./consts"

/** The shortcuts-dialog slot the viewer renders for extension tools. */
export function PinStoryShortcutsDialog(props: TLUiKeyboardShortcutsDialogProps) {
  return (
    <DefaultKeyboardShortcutsDialog {...props}>
      <TldrawUiMenuGroup id="extension-tools">
        <TldrawUiMenuToolItem toolId={PIN_TOOL_ID} />
      </TldrawUiMenuGroup>
      <DefaultKeyboardShortcutsDialogContent />
    </DefaultKeyboardShortcutsDialog>
  )
}
