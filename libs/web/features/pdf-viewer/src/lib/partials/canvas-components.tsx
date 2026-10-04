import {
  DefaultKeyboardShortcutsDialog,
  DefaultKeyboardShortcutsDialogContent,
  DefaultToolbar,
  DefaultToolbarContent,
  TldrawUiMenuGroup,
  TldrawUiMenuToolItem,
  ToolbarItem,
  type TLComponents,
  type TLUiKeyboardShortcutsDialogProps
} from "tldraw"

import type { MergedCanvasExtensions } from "../types"

import { DOCUMENT_TOOLS_LABEL } from "../consts"
import { ToolbarSlot } from "./viewer-chrome"

/**
 * tldraw slots for the merged extensions. Slots no extension needs stay
 * unset, so tldraw keeps its stock toolbar and dialogs.
 */
export function createCanvasComponents({
  toolIds,
  inFrontOfTheCanvas
}: Pick<MergedCanvasExtensions, "toolIds" | "inFrontOfTheCanvas">): TLComponents {
  const components: TLComponents = {}

  if (toolIds.length > 0) {
    components.Toolbar = function ViewerToolbar() {
      return (
        <ToolbarSlot>
          <DefaultToolbar>
            {toolIds.map((toolId) => (
              <ToolbarItem key={toolId} tool={toolId} />
            ))}
            <DefaultToolbarContent />
          </DefaultToolbar>
        </ToolbarSlot>
      )
    }
    components.KeyboardShortcutsDialog = function ViewerKeyboardShortcutsDialog(
      props: TLUiKeyboardShortcutsDialogProps
    ) {
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

  if (inFrontOfTheCanvas.length > 0) {
    components.InFrontOfTheCanvas = function ViewerInFrontOfTheCanvas() {
      return (
        <>
          {inFrontOfTheCanvas.map((Component, index) => (
            <Component key={index} />
          ))}
        </>
      )
    }
  }

  return components
}
