import { Camera } from "lucide-react"
import { useEffect } from "react"
import { Box, computed, useEditor, type Computed, type Editor, type TLUiOverrides } from "tldraw"

import type { CameraExtension, CameraExtensionOptions } from "./types"

import { CameraTool, dropDefaultFrame } from "./camera-tool"
import {
  CAMERA_KBD,
  CAMERA_TOOL_ID,
  CAMERA_TOOL_LABEL,
  CROP_FRAME,
  CROP_FRAME_TOOLBAR_CLASS,
  CROP_FRAME_TOOLBAR_LABEL
} from "./consts"
import { CropFrameShapeUtil } from "./crop-frame-shape-util"
import { CropFrameToolbar } from "./crop-frame-toolbar/crop-frame-toolbar"
import { CropMarquee } from "./crop-marquee"
import { registerCropShortcuts } from "./crop-shortcuts"
import { withFramelessExports } from "./export-actions"
import { FirstUseHint } from "./first-use-hint"
import { StylePanelGuard } from "./style-panel-guard"

/** Move keyboard focus to the crop toolbar, if a crop frame is what's selected. */
function focusCropToolbar(editor: Editor): boolean {
  if (editor.getOnlySelectedShape()?.type !== CROP_FRAME) return false
  const button = editor
    .getContainer()
    .querySelector<HTMLButtonElement>(`.${CROP_FRAME_TOOLBAR_CLASS} button`)
  button?.focus()
  return button !== null
}

const overrides: TLUiOverrides = {
  tools(editor, tools) {
    return {
      ...tools,
      [CAMERA_TOOL_ID]: {
        id: CAMERA_TOOL_ID,
        label: CAMERA_TOOL_LABEL,
        icon: <Camera size={18} strokeWidth={1.75} />,
        kbd: CAMERA_KBD,
        // Activating the idle tool again is the keyboard way to make a frame.
        onSelect: () => {
          if (editor.isIn(`${CAMERA_TOOL_ID}.idle`)) dropDefaultFrame(editor)
          else editor.setCurrentTool(CAMERA_TOOL_ID)
        }
      }
    }
  },
  // Canvas keyboard users reach contextual toolbars with Ctrl/Cmd+Enter
  // (tldraw's "adjust shape styles"): Tab is taken while shapes are selected.
  actions(editor, defaultActions, helpers) {
    const actions = withFramelessExports(editor, defaultActions, helpers)
    const adjustStyles = actions["adjust-shape-styles"]
    if (!adjustStyles) return actions
    return {
      ...actions,
      "adjust-shape-styles": {
        ...adjustStyles,
        // Read-only users can still export, so they need the way in too.
        readonlyOk: true,
        onSelect: (source) => {
          if (focusCropToolbar(editor)) return
          if (editor.getIsReadonly()) return
          return adjustStyles.onSelect(source)
        }
      }
    }
  },
  // tldraw announces a selected shape by the `tool.<type>` message.
  translations: {
    en: { [`tool.${CROP_FRAME}`]: CROP_FRAME_TOOLBAR_LABEL },
    fr: { [`tool.${CROP_FRAME}`]: CROP_FRAME_TOOLBAR_LABEL }
  }
}

/**
 * The camera tool and its crop frames, as a canvas extension. Create it once
 * per document (module scope or `useMemo`): tldraw expects stable utils.
 */
export function createCameraExtension({
  documentName
}: CameraExtensionOptions = {}): CameraExtension {
  function CameraInFrontOfTheCanvas() {
    const editor = useEditor()
    useEffect(() => registerCropShortcuts(editor, documentName), [editor])
    return (
      <>
        <FirstUseHint />
        <StylePanelGuard />
        <CropMarquee />
        <CropFrameToolbar documentName={documentName} />
      </>
    )
  }

  return {
    toolIds: [CAMERA_TOOL_ID],
    shapeUtils: [CropFrameShapeUtil],
    tools: [CameraTool],
    overrides,
    InFrontOfTheCanvas: CameraInFrontOfTheCanvas
  }
}

function areSameBounds(a: readonly Box[], b: readonly Box[]) {
  return a.length === b.length && a.every((box, i) => b[i] !== undefined && Box.Equals(box, b[i]))
}

const cropFrameBounds = new WeakMap<Editor, Computed<Box[]>>()

/**
 * Page bounds of every crop frame on the current page. Reactive: a caller
 * re-runs when frames are added, moved or resized, and not for other shapes.
 */
export function getCropFrameBounds(editor: Editor): Box[] {
  let bounds = cropFrameBounds.get(editor)
  if (!bounds) {
    const frames = editor.store.query.records("shape", () => ({ type: { eq: CROP_FRAME } }))
    bounds = computed(
      "crop frame bounds",
      () => {
        const pageId = editor.getCurrentPageId()
        return frames.get().flatMap((shape) => {
          if (editor.getAncestorPageId(shape) !== pageId) return []
          const pageBounds = editor.getShapePageBounds(shape)
          return pageBounds ? [pageBounds] : []
        })
      },
      { isEqual: areSameBounds }
    )
    cropFrameBounds.set(editor, bounds)
  }
  return bounds.get()
}
