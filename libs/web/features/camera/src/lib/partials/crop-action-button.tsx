import { useCallback } from "react"
import { TldrawUiButtonIcon, TldrawUiToolbarButton, type TLUiIconJsx } from "tldraw"

import type { CropAction } from "../types"

interface CropActionButtonProps {
  action: CropAction
  label: string
  icon: TLUiIconJsx
  onRun: (action: CropAction) => void
}

export function CropActionButton({ action, label, icon, onRun }: CropActionButtonProps) {
  const handleClick = useCallback(() => onRun(action), [action, onRun])
  return (
    <TldrawUiToolbarButton type="icon" title={label} onClick={handleClick}>
      <TldrawUiButtonIcon icon={icon} />
    </TldrawUiToolbarButton>
  )
}
