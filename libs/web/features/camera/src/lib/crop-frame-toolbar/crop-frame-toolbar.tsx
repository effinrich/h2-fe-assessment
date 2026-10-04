import { Check, ClipboardCopy, ImageDown, VectorSquare } from "lucide-react"
import { useCallback, useId, type ReactElement } from "react"
import {
  TldrawUiButtonIcon,
  TldrawUiContextualToolbar,
  TldrawUiToolbarButton,
  useEditor,
  useValue,
  type TLShapeId
} from "tldraw"

import { Box, Spinner, Text } from "@h2-fe/ui"

import type { CropAction } from "../types"

import {
  CROP_ACTION_LABELS,
  CROP_FRAME_TOOLBAR_CLASS,
  CROP_FRAME_TOOLBAR_DESCRIPTION,
  CROP_FRAME_TOOLBAR_LABEL,
  EMPTY_FRAME_HINT
} from "../consts"
import {
  useCropActions,
  useCropFrameToolbarTarget,
  useCropToolbarAnchor,
  useIsCropFrameEmpty
} from "./hooks"

const ICON_SIZE = 18
const ICON_STROKE = 1.75

const ACTIONS: readonly { action: CropAction; icon: ReactElement }[] = [
  { action: "download-png", icon: <ImageDown size={ICON_SIZE} strokeWidth={ICON_STROKE} /> },
  { action: "copy-png", icon: <ClipboardCopy size={ICON_SIZE} strokeWidth={ICON_STROKE} /> },
  { action: "download-svg", icon: <VectorSquare size={ICON_SIZE} strokeWidth={ICON_STROKE} /> }
]

/** `TldrawUiContextualToolbar` doesn't forward `aria-describedby`; set it on its toolbar. */
function describeToolbar(description: HTMLElement | null): (() => void) | undefined {
  const toolbar = description?.closest('[role="toolbar"]')
  if (!description || !toolbar) return undefined
  toolbar.setAttribute("aria-describedby", description.id)
  return () => toolbar.removeAttribute("aria-describedby")
}

const DONE_ICON = <Check size={ICON_SIZE} strokeWidth={ICON_STROKE} />

// tldraw.css is unlayered, so it beats Chakra's layered recipes; repeating the
// class outranks `.tlui-button` (0,1,0) and tldraw's focus ring (0,4,0).
const actionButtonCss = {
  "&&&": { minWidth: "44px", height: "44px", paddingInline: "0" },
  "&&&&&:focus-visible": {
    outlineWidth: "2px",
    outlineStyle: "solid",
    outlineColor: "brand.focusRing",
    outlineOffset: "-4px",
    borderRadius: "lg"
  }
}

interface CropActionButtonProps {
  action: CropAction
  label: string
  icon: ReactElement
  isInert: boolean
  isBusy: boolean
  isDone: boolean
  describedBy: string | undefined
  onRun: (action: CropAction) => void
}

function CropActionButton({
  action,
  label,
  icon,
  isInert,
  isBusy,
  isDone,
  describedBy,
  onRun
}: CropActionButtonProps) {
  const handleClick = useCallback(() => {
    if (!isInert) onRun(action)
  }, [action, isInert, onRun])

  // Disabled stays focusable (aria-disabled, not disabled), so keyboard users
  // can still find the actions and hear why they're unavailable.
  return (
    <Box asChild colorPalette="brand" css={actionButtonCss}>
      <TldrawUiToolbarButton
        type="icon"
        title={label}
        aria-disabled={isInert || undefined}
        data-disabled={isInert ? "" : undefined}
        aria-busy={isBusy || undefined}
        aria-describedby={describedBy}
        onClick={handleClick}
      >
        {isBusy ? (
          <Spinner size="sm" color="brand.fg" />
        ) : (
          <TldrawUiButtonIcon icon={isDone ? DONE_ICON : icon} />
        )}
      </TldrawUiToolbarButton>
    </Box>
  )
}

interface CropFrameToolbarContentProps {
  frameId: TLShapeId
  documentName?: string
}

function CropFrameToolbarContent({ frameId, documentName }: CropFrameToolbarContentProps) {
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

/** Export actions beside the selected crop frame (the `InFrontOfTheCanvas` slot). */
export function CropFrameToolbar({ documentName }: { documentName?: string }) {
  const editor = useEditor()
  const frameId = useCropFrameToolbarTarget(editor)
  if (!frameId) return null
  return <CropFrameToolbarContent key={frameId} frameId={frameId} documentName={documentName} />
}
