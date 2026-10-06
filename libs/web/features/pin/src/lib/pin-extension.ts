import type { TLUiOverrides } from "tldraw"

import { createElement } from "react"

import { PinIcon } from "./partials/pin-icon"
import { PinBindingUtil } from "./pin-binding-util"
import { PIN_TYPE, PinShapeUtil } from "./pin-shape-util"
import { PinTool } from "./pin-tool"

const LABEL_KEY = "tool.pin"

const overrides: TLUiOverrides = {
  tools: (editor, tools) => ({
    ...tools,
    [PIN_TYPE]: {
      id: PIN_TYPE,
      label: LABEL_KEY,
      icon: createElement(PinIcon),
      kbd: "p",
      onSelect: () => editor.setCurrentTool(PIN_TYPE)
    }
  }),
  translations: { en: { [LABEL_KEY]: "Pin" } }
}

/** The pin tool (`P`) for a tldraw canvas. Pins never attach to locked shapes, such as PDF pages. */
export const pinExtension = {
  toolIds: [PIN_TYPE],
  shapeUtils: [PinShapeUtil],
  bindingUtils: [PinBindingUtil],
  tools: [PinTool],
  overrides
}
