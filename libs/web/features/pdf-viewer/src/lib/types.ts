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

export interface PageOverlay {
  page: number
  state: "loading" | "error"
  style: { left: number; top: number; width: number; height: number }
}

export interface PdfViewerScreenProps {
  filename?: string
  onMarksChange?: (hasMarks: boolean) => void
  document?: PdfDocumentSummary
  isLoading?: boolean
  isError?: boolean
  onRetry?: () => void
  onOpenAnother: () => void
}
