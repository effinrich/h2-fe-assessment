import { useId } from "react"
import { TldrawUiContextualToolbar, useEditor, useValue, type TLShapeId } from "tldraw"

import { Text } from "@h2-fe/ui"

import {
  CROP_ACTION_LABELS,
  CROP_FRAME_TOOLBAR_CLASS,
  CROP_FRAME_TOOLBAR_DESCRIPTION,
  CROP_FRAME_TOOLBAR_LABEL,
  EMPTY_FRAME_HINT
} from "../consts"
import { CropActionButton } from "./crop-action-button"
import { useCropActions, useCropToolbarAnchor, useIsCropFrameEmpty } from "./hooks"
import { ACTIONS } from "./icons"

/** `TldrawUiContextualToolbar` doesn't forward `aria-describedby`; set it on its toolbar. */
function describeToolbar(description: HTMLElement | null): (() => void) | undefined {
  const toolbar = description?.closest('[role="toolbar"]')
  if (!description || !toolbar) return undefined
  toolbar.setAttribute("aria-describedby", description.id)
  return () => toolbar.removeAttribute("aria-describedby")
}

interface CropFrameToolbarContentProps {
  frameId: TLShapeId
  documentName?: string
}

export function CropFrameToolbarContent({ frameId, documentName }: CropFrameToolbarContentProps) {
  const editor = useEditor()
  const colorMode = useValue("crop toolbar colour mode", () => editor.getColorMode(), [editor])
  const isEmpty = useIsCropFrameEmpty(editor, frameId)
  const { busyAction, doneAction, isBusy, run } = useCropActions(editor, frameId, documentName)
  const hintId = useId()
  const descriptionId = useId()
  const getSelectionBounds = useCropToolbarAnchor(editor, frameId)
  const isInert = isEmpty || isBusy

  return (
    <TldrawUiContextualToolbar
      className={`${CROP_FRAME_TOOLBAR_CLASS} ${colorMode}`}
      getSelectionBounds={getSelectionBounds}
      label={CROP_FRAME_TOOLBAR_LABEL}
    >
      <Text id={descriptionId} ref={describeToolbar} display="none">
        {CROP_FRAME_TOOLBAR_DESCRIPTION}
      </Text>
      {ACTIONS.map(({ action, icon }) => (
        <CropActionButton
          key={action}
          action={action}
          label={CROP_ACTION_LABELS[action]}
          icon={icon}
          isInert={isInert}
          isBusy={busyAction === action}
          isDone={doneAction === action}
          describedBy={isEmpty ? hintId : undefined}
          onRun={run}
        />
      ))}
      {isEmpty && (
        <Text
          id={hintId}
          alignSelf="center"
          textStyle="xs"
          color="fg.muted"
          ps="1"
          pe="3"
          whiteSpace="nowrap"
        >
          {EMPTY_FRAME_HINT}
        </Text>
      )}
    </TldrawUiContextualToolbar>
  )
}
