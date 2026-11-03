import { expect, test } from "bun:test"
import { PDFDocument, degrees, type PDFPage } from "pdf-lib"

import { annotatedFilename, pageMatchesCanvas } from "./export-pdf"

async function aPage(build?: (page: PDFPage) => void): Promise<PDFPage> {
  const document = await PDFDocument.create()
  const page = document.addPage([595, 842])
  build?.(page)
  return page
}

test("the export is named after the source, marked as annotated", () => {
  expect(annotatedFilename("report.pdf")).toBe("report-annotated.pdf")
  expect(annotatedFilename("report.PDF")).toBe("report-annotated.PDF")
  expect(annotatedFilename("report")).toBe("report-annotated.pdf")
  expect(annotatedFilename("a.b.pdf")).toBe("a.b-annotated.pdf")
  // A leading dot is the file's own name, not an extension.
  expect(annotatedFilename(".hidden")).toBe(".hidden-annotated.pdf")
})

test("a page that lines up with the canvas is the page to copy", async () => {
  const page = await aPage()
  expect(pageMatchesCanvas(page, 595, 842)).toBe(true)
})

test("a rotated page is drawn from the canvas instead", async () => {
  const page = await aPage((p) => p.setRotation(degrees(90)))
  expect(pageMatchesCanvas(page, 595, 842)).toBe(false)
})

test("a page whose boxes differ is drawn from the canvas instead", async () => {
  const cropped = await aPage((p) => p.setCropBox(0, 0, 595, 800))
  expect(pageMatchesCanvas(cropped, 595, 842)).toBe(false)

  const offset = await aPage((p) => p.setMediaBox(10, 10, 605, 852))
  expect(pageMatchesCanvas(offset, 595, 842)).toBe(false)
})

test("a page that is nearly the right size still counts", async () => {
  const page = await aPage()
  // Half a point of slack either way: the page is 595 by 842.
  expect(pageMatchesCanvas(page, 595.4, 842)).toBe(true)
  expect(pageMatchesCanvas(page, 594.6, 842)).toBe(true)
  expect(pageMatchesCanvas(page, 595.6, 842)).toBe(false)
  expect(pageMatchesCanvas(page, 595, 841.6)).toBe(true)
  expect(pageMatchesCanvas(page, 595, 841.4)).toBe(false)
})
