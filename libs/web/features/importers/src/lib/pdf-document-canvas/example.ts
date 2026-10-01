import { PDFDocument, StandardFonts, rgb } from 'pdf-lib'

// "Use an example" needs a document and we ship no fixtures, so we draw one.
// pdf-lib already earns its place for export; this reuses it for the empty state.
export async function createExamplePdf(): Promise<File> {
  const document = await PDFDocument.create()
  const font = await document.embedFont(StandardFonts.Helvetica)
  const bold = await document.embedFont(StandardFonts.HelveticaBold)

  for (const pageNumber of [1, 2]) {
    const page = document.addPage([595, 842])
    page.drawText(`Example page ${pageNumber}`, {
      x: 56,
      y: 762,
      size: 26,
      font: bold,
      color: rgb(0.08, 0.08, 0.09),
    })
    page.drawText('Draw on this page with the tools in the top left.', {
      x: 56,
      y: 722,
      size: 13,
      font,
      color: rgb(0.35, 0.35, 0.38),
    })
    page.drawLine({
      start: { x: 56, y: 700 },
      end: { x: 539, y: 700 },
      thickness: 1,
      color: rgb(0.85, 0.85, 0.87),
    })
  }

  const bytes = await document.save()
  // slice() allocates a fresh ArrayBuffer-backed view; pdf-lib's output is typed
  // as ArrayBufferLike, which BlobPart does not accept.
  return new File([bytes.slice()], 'example.pdf', { type: 'application/pdf' })
}
