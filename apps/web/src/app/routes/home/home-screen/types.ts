import type { ChangeEventHandler } from "react"

export interface HomeScreenProps {
  onFileChange: ChangeEventHandler<HTMLInputElement>
  onUseExample: () => void
  isBusy?: boolean
}
