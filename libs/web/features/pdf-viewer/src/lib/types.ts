export interface RenderedPdfPage {
  pageNumber: number
  width: number
  height: number
  dataUrl: string
}

export interface PdfDocumentSummary {
  pages: RenderedPdfPage[]
}

export type FileToken = string

export interface PdfViewerScreenProps {
  pages?: RenderedPdfPage[]
  isLoading?: boolean
  isError?: boolean
  onRetry?: () => void
  onOpenAnother: () => void
}
