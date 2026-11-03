import { PDFDocument, type PDFPage } from "pdf-lib"
import { Box, type Editor, type TLShape } from "tldraw"

import type { PdfDocument } from "./types"

import { PDF_PAGE_SHAPE_ID } from "./consts"
import { pageBounds } from "./utils"

/** How far a page box may differ from the canvas before we stop trusting it, in points. */
const POINT_TOLERANCE = 0.5

/** Whether two point measurements are the same, to within the tolerance. */
function same(a: number, b: number): boolean {
  return Math.abs(a - b) <= POINT_TOLERANCE
}

export interface ExportPdfOptions {
  editor: Editor
  document: PdfDocument
  /** The file the document was opened from; its bytes are the base of the export. */
  source: File
  /** Shape types that are canvas furniture rather than document content. */
  nonDocumentShapeTypes?: readonly string[]
}

/** The shapes that are part of the document: not a page, and not furniture. */
function documentShapes(editor: Editor, nonDocumentShapeTypes: readonly string[]): TLShape[] {
  return editor
    .getCurrentPageShapes()
    .filter((shape) => !PDF_PAGE_SHAPE_ID.test(shape.id))
    .filter((shape) => !nonDocumentShapeTypes.includes(shape.type))
}

/**
 * The marks that fall on a page. A mark that overlaps two pages is on both,
 * clipped to each; a mark that overlaps no page is on none.
 */
function marksOnPage(
  editor: Editor,
  region: Box,
  nonDocumentShapeTypes: readonly string[]
): TLShape[] {
  return documentShapes(editor, nonDocumentShapeTypes).filter((shape) => {
    const bounds = editor.getShapePageBounds(shape)
    return bounds !== undefined && region.collides(bounds)
  })
}

/** Renders the marks over a page's region, on a transparent background. */
async function renderMarks(
  editor: Editor,
  marks: TLShape[],
  region: Box
): Promise<Uint8Array | null> {
  if (marks.length === 0) return null
  const { blob } = await editor.toImage(
    marks.map((shape) => shape.id),
    {
      format: "png",
      bounds: region,
      background: false,
      // The region is the page: no trimming to the marks, and no padding, so
      // the layer is the same rectangle as the page underneath it.
      padding: 0,
      pixelRatio: 1,
      // The page is white paper whichever way the chrome is coloured.
      darkMode: false
    }
  )
  return new Uint8Array(await blob.arrayBuffer())
}

function dataUrlToBytes(dataUrl: string): Uint8Array {
  const base64 = dataUrl.slice(dataUrl.indexOf(",") + 1)
  const binary = atob(base64)
  const bytes = new Uint8Array(binary.length)
  for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i)
  return bytes
}

/**
 * Whether the source PDF's page is the page the canvas shows. It is when the
 * page is not rotated, the box the canvas drew is the same size as the box
 * the PDF holds, and the visible box and the content box are the same box —
 * otherwise the marks would not land where they belong.
 */
export function pageMatchesCanvas(page: PDFPage, pointWidth: number, pointHeight: number): boolean {
  if (page.getRotation().angle !== 0) return false
  const media = page.getMediaBox()
  const crop = page.getCropBox()
  return (
    same(crop.width, pointWidth) &&
    same(crop.height, pointHeight) &&
    same(media.x, crop.x) &&
    same(media.y, crop.y) &&
    same(media.width, crop.width) &&
    same(media.height, crop.height)
  )
}

/**
 * The document with the user's marks on it, as a PDF.
 *
 * The source file is the base: its pages are copied into the new document,
 * so the text stays text. The marks are a layer over each page. Where the
 * source page is not the page the canvas shows — a rotated page, a document
 * `pdf-lib` cannot open — the page is drawn from its rendering instead, so
 * the export is always what the user saw.
 */
export async function exportPdf({
  editor,
  document,
  source,
  nonDocumentShapeTypes = []
}: ExportPdfOptions): Promise<Uint8Array> {
  const sourceBytes = new Uint8Array(await source.arrayBuffer())
  let sourceDocument: PDFDocument | null = null
  try {
    sourceDocument = await PDFDocument.load(sourceBytes)
  } catch {
    sourceDocument = null
  }

  const output = await PDFDocument.create()

  // One page at a time, in order: the pages of the export have to come out in
  // the order of the document, and a long document should not have all of its
  // pixels in memory at once.
  for (const [index, page] of document.pages.entries()) {
    const bounds = pageBounds(document.pages, page.pageNumber)
    if (!bounds) continue
    const region = new Box(bounds.x, bounds.y, bounds.w, bounds.h)

    const pointWidth = region.w / document.scale
    const pointHeight = region.h / document.scale
    const overlay = await renderMarks(
      editor,
      marksOnPage(editor, region, nonDocumentShapeTypes),
      region
    )
    const sourcePage = sourceDocument?.getPage(index)

    if (sourcePage && pageMatchesCanvas(sourcePage, pointWidth, pointHeight)) {
      const [copied] = await output.copyPages(sourceDocument!, [index])
      output.addPage(copied)
      if (overlay) {
        const image = await output.embedPng(overlay)
        copied.drawImage(image, { x: 0, y: 0, width: pointWidth, height: pointHeight })
      }
      continue
    }

    // The page the canvas shows, drawn from its rendering.
    const drawn = output.addPage([pointWidth, pointHeight])
    const pageImage = await output.embedPng(dataUrlToBytes(page.src))
    drawn.drawImage(pageImage, { x: 0, y: 0, width: pointWidth, height: pointHeight })
    if (overlay) {
      const image = await output.embedPng(overlay)
      drawn.drawImage(image, { x: 0, y: 0, width: pointWidth, height: pointHeight })
    }
  }

  return output.save()
}

/** The name the export is downloaded under: the source's name, marked as annotated. */
export function annotatedFilename(filename: string): string {
  const dot = filename.lastIndexOf(".")
  if (dot <= 0) return `${filename}-annotated.pdf`
  return `${filename.slice(0, dot)}-annotated${filename.slice(dot)}`
}

/** Downloads bytes as a file. */
export function downloadFile(bytes: Uint8Array, filename: string, type: string) {
  const url = URL.createObjectURL(new Blob([bytes.slice()], { type }))
  const link = document.createElement("a")
  link.href = url
  link.download = filename
  link.click()
  // Revoking immediately can cancel the download in some browsers.
  setTimeout(() => URL.revokeObjectURL(url), 10_000)
}
