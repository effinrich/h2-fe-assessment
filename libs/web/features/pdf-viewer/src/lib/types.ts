export interface PdfPage {
  pageNumber: number
  width: number
  height: number
}

export interface RenderedPdfPage extends PdfPage {
  dataUrl: string
}

export interface PdfDocumentSummary {
  pages: PdfPage[]
  renderPages: (pageNumbers: number[]) => Promise<RenderedPdfPage[]>
  destroy: () => Promise<void>
}

export type FileToken = string

export interface PdfViewerScreenProps {
  document?: PdfDocumentSummary
  isLoading?: boolean
  isError?: boolean
  onRetry?: () => void
  onOpenAnother: () => void
}
