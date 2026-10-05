import { useCallback, type ReactElement } from "react"
import { TldrawUiButtonIcon, TldrawUiToolbarButton } from "tldraw"

import { Box, Spinner } from "@h2-fe/ui"

import type { CropAction } from "../types"

import { DONE_ICON } from "./icons"

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

export function CropActionButton({
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
