import { fireEvent, render, screen } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'
import { PdfDocumentEmpty } from './pdf-document-empty'

// Spec: docs/specs/task-2-pdf.md, criterion 1 —
// "Given no document, the canvas offers 'Open PDF' and 'Use an example'."
describe('PdfDocumentEmpty', () => {
  it('offers Open PDF and Use an example when no document is loaded', () => {
    render(
      <PdfDocumentEmpty onOpenPdf={vi.fn()} onUseExample={vi.fn()} />,
    )
    // getByRole throws when absent, so these are real assertions.
    expect(screen.getByRole('button', { name: /open pdf/i })).toBeTruthy()
    expect(screen.getByRole('button', { name: /use an example/i })).toBeTruthy()
  })

  it('calls onOpenPdf when the open action is chosen', () => {
    const onOpenPdf = vi.fn()
    render(<PdfDocumentEmpty onOpenPdf={onOpenPdf} onUseExample={vi.fn()} />)
    fireEvent.click(screen.getByRole('button', { name: /open pdf/i }))
    expect(onOpenPdf).toHaveBeenCalledTimes(1)
  })

  it('calls onUseExample when the example action is chosen', () => {
    const onUseExample = vi.fn()
    render(<PdfDocumentEmpty onOpenPdf={vi.fn()} onUseExample={onUseExample} />)
    fireEvent.click(screen.getByRole('button', { name: /use an example/i }))
    expect(onUseExample).toHaveBeenCalledTimes(1)
  })
})
