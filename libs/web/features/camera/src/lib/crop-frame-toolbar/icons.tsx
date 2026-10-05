import type { ReactElement } from "react"

import { Check, ClipboardCopy, ImageDown, VectorSquare } from "lucide-react"

import type { CropAction } from "../types"

const ICON_SIZE = 18
const ICON_STROKE = 1.75

export const ACTIONS: readonly { action: CropAction; icon: ReactElement }[] = [
  { action: "download-png", icon: <ImageDown size={ICON_SIZE} strokeWidth={ICON_STROKE} /> },
  { action: "copy-png", icon: <ClipboardCopy size={ICON_SIZE} strokeWidth={ICON_STROKE} /> },
  { action: "download-svg", icon: <VectorSquare size={ICON_SIZE} strokeWidth={ICON_STROKE} /> }
]

export const DONE_ICON = <Check size={ICON_SIZE} strokeWidth={ICON_STROKE} />
