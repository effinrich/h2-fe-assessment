import { createElement } from "react"

import type { PinExtension, PinExtensionOptions } from "./types"

import { PIN_KBD, PIN_LABEL, PIN_LABEL_KEY, PIN_TOOL_ID } from "./consts"
import { PinIcon } from "./partials/pin-icon"
import { PinBindingUtil } from "./pin-binding-util"
import { feedbackOf, PinFeedbackOverlayUtil } from "./pin-feedback-overlay"
import { listenForAncestorMoves } from "./pin-follow"
import { listenForLocks, listenForRest, settlePins, type Settle } from "./pin-settle"
import { PinShapeUtil } from "./pin-shape-util"
import { createPinTool } from "./pin-tool"

/**
 * The pin tool as a canvas extension. Create it once (module scope or
 * `useMemo`): tldraw expects stable util and tool arrays.
 */
export function createPinExtension({
  canAttach = () => true
}: PinExtensionOptions = {}): PinExtension {
  const settle: Settle = (editor, pinIds) => {
    const attached = settlePins(editor, pinIds, canAttach)
    if (attached.size > 0) feedbackOf(editor)?.flash(attached)
  }

  return {
    toolIds: [PIN_TOOL_ID],
    shapeUtils: [PinShapeUtil],
    bindingUtils: [PinBindingUtil],
    tools: [createPinTool(settle)],
    overlayUtils: [PinFeedbackOverlayUtil],
    overrides: {
      tools: (editor, tools) => ({
        ...tools,
        [PIN_TOOL_ID]: {
          id: PIN_TOOL_ID,
          label: PIN_LABEL_KEY,
          icon: createElement(PinIcon),
          kbd: PIN_KBD,
          onSelect: () => editor.setCurrentTool(PIN_TOOL_ID)
        }
      }),
      translations: { en: { [PIN_LABEL_KEY]: PIN_LABEL } }
    },
    onMount: (editor) => {
      const stopRest = listenForRest(editor, settle)
      const stopLocks = listenForLocks(editor, settle)
      const stopAncestors = listenForAncestorMoves(editor)
      return () => {
        stopRest()
        stopLocks()
        stopAncestors()
      }
    }
  }
}
