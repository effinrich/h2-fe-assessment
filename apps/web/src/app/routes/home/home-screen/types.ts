import type { ChangeEventHandler } from "react"

export interface HomeScreenProps {
  onFileChange: ChangeEventHandler<HTMLInputElement>
  /** A single PDF was dropped on the screen. */
  onDropFile: (file: File) => void
  /** Something other than a single PDF was dropped. */
  onRejectDrop: () => void
  onUseExample: () => void
  isBusy?: boolean
}
