import { useCallback } from "react"
import { Box, useValue, type Editor, type TLShapeId } from "tldraw"

import type { CropAction } from "../types"

import { CROP_FRAME, CROP_FRAME_LABEL_ATTR, CROP_FRAME_TOOLBAR_CLASS } from "../consts"
import { getCropActionState, startCropAction } from "../crop-action-state"
import { getCropExportPlan } from "../crop-export"
import { cropToolbarAnchor } from "../utils"

/** The crop frame whose actions to show: the sole selection, while idle. */
export function useCropFrameToolbarTarget(editor: Editor): TLShapeId | null {
  return useValue(
    "crop frame toolbar target",
    () => {
      const shape = editor.getOnlySelectedShape()
      if (shape?.type !== CROP_FRAME) return null
      return editor.isInAny("select.idle", "select.pointing_shape") ? shape.id : null
    },
    [editor]
  )
}

/** `getSelectionBounds` for the toolbar: above the frame, or below its label when there's no room. */
export function useCropToolbarAnchor(editor: Editor, frameId: TLShapeId) {
  return useCallback(() => {
    const selection = editor.getSelectionScreenBounds()
    if (!selection) return undefined
    const container = editor.getContainer()
    const toolbar = container.querySelector(`.${CROP_FRAME_TOOLBAR_CLASS}`)
    const label = container.querySelector(`[data-shape-id="${frameId}"] [${CROP_FRAME_LABEL_ATTR}]`)
    return Box.From(
      cropToolbarAnchor({
        selection,
        viewport: editor.getViewportScreenBounds(),
        toolbarHeight: toolbar?.getBoundingClientRect().height ?? 0,
        labelHeight: label?.getBoundingClientRect().height ?? 0
      })
    )
  }, [editor, frameId])
}

export function useIsCropFrameEmpty(editor: Editor, frameId: TLShapeId): boolean {
  return useValue(
    "crop frame is empty",
    () => (getCropExportPlan(editor, frameId)?.ids.length ?? 0) === 0,
    [editor, frameId]
  )
}

/** This frame's busy and just-finished actions, and whether any export is in flight. */
export function useCropActions(editor: Editor, frameId: TLShapeId, documentName?: string) {
  const { busy, done } = useValue("crop action state", () => getCropActionState(editor).get(), [
    editor
  ])

  const run = useCallback(
    (action: CropAction) => startCropAction(editor, { frameId, action, documentName }),
    [editor, frameId, documentName]
  )

  return {
    busyAction: busy?.frameId === frameId ? busy.action : null,
    doneAction: done?.frameId === frameId ? done.action : null,
    isBusy: busy !== null,
    run
  }
}
