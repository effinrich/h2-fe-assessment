import { Button } from '@h2-fe/ui'
import type { PdfDocumentEmptyProps } from './pdf-document-empty.types'

// The first thing anyone sees: a document can be opened or an example loaded.
// The demo offered the same two controls; here they carry a hint of what a PDF
// is for in this app, so the empty state teaches instead of asking.
export function PdfDocumentEmpty({ onOpenPdf, onUseExample }: PdfDocumentEmptyProps) {
  return (
    <div>
      <h2>Open a document</h2>
      <p>A PDF lands on the canvas, and anything you draw on top of it stays yours.</p>
      <div>
        <Button variant="solid" onClick={onOpenPdf}>
          Open PDF
        </Button>
        <Button variant="outline" onClick={onUseExample}>
          Use an example
        </Button>
      </div>
    </div>
  )
}
