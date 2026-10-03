export interface HomeScreenProps {
  onFileChosen: (file: File) => void
  onUseExample: () => void
  isBusy?: boolean
}
