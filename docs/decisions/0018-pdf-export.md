# 0018 — The document comes back as a PDF

- Status: accepted
- Date: 2026-10-27

## Context

The brief puts this in task 4: "Our products don't stop until the user has
their data back to them, in formats that are familiar and universal." The
camera answers that for a region of the canvas. It does not answer it for
the document itself, and the reference demo does: it offers an "Export PDF"
button, so the annotated document comes back as a PDF.

0012 decided to rasterise. Each page is rendered once through pdfjs and
placed on the canvas as a locked image shape, which is cheap to draw and
cheap to keep in memory, and the record names the cost: it costs the
sharpness of the original and "the way back to a PDF". That cost was real
while there was no way back at all. This is the way back.

The question is what a PDF export means for an app that has thrown the
original away. The pages on the canvas are 2x PNGs, so the obvious export is
a PDF of those PNGs. That file would be a picture of a document: the text
would not be selectable, the type would not be sharp at any zoom, and
printing it would print a photograph of a page.

## The done state

The brief specifies a product, not an implementation, so the first question
is what the product is. These five statements are what the export is, and
each one is checkable by looking at the file.

1. **There is an Export PDF button, and it is where the other document
   actions are.** It sits in the document header next to "Open another", so
   the way back to the data is in the same place as the way to load it. It
   is disabled while the document is loading and while an export is
   running, so it cannot be pressed twice.
2. **The export is a PDF, one page per document page, at the size of the
   source page.** Not a screenshot of the app, and not a single long image:
   a file that opens in a PDF reader with the right number of pages and the
   right page boxes.
3. **The document in the export is still a document.** The page content is
   the source PDF's own page, copied, so the text in it is still text: it
   can be selected, searched and printed sharp. The file is the user's
   document with their marks on it, not a rendering of it.
4. **The marks are on the right page, in the right place.** A mark the user
   drew over page 3 is on page 3 of the export, at the position they drew
   it. The crop frames are not: they are furniture for the canvas, not
   content of the document.
5. **Exporting does not consume anything.** The marks stay on the canvas
   afterwards, so the user can move one, export again, and the new file has
   it in the new place.

## Decision

**The original PDF, with the marks on top.**

- The source file is the base. `pdf-lib` loads it and its pages are copied
  into the new document, so the page content, the fonts and the page boxes
  are the ones the user opened. The bytes are read from the `File` at
  export time rather than kept in memory, so the cost of the export is not
  paid by the session that loaded the document.
- The marks are a layer over the page. For each page, the shapes that
  overlap that page are rendered by tldraw over that page's region, on a
  transparent background, and the image is drawn on top of the copied page.
  The region is the page's own rectangle in canvas space, so the layer
  lands where the marks are.
- The export is the same for every page: the page, then the marks.

Two rules keep it honest where the source document is not simple:

- **A page the app cannot line up is drawn the way the canvas shows it.**
  The canvas shows the page the way pdfjs rendered it, which is the page
  rotated if the document says so. Where the page the source PDF holds and
  the page the canvas shows are the same page — same size, same rotation —
  the source page is copied and the marks go on top of it. Where they are
  not, the page is drawn from its rendering instead, so the export is
  always what the user saw. The same fallback covers a document `pdf-lib`
  cannot open at all.
- **A mark that overlaps two pages is on both.** It is clipped to each
  page's region, which is what the canvas shows. A mark that overlaps no
  page is on no page: it is not part of the document.

## Consequences

- The document keeps its text and its vectors. The marks do not: they come
  back as a raster layer, because drawing tldraw's shape set as PDF
  operators is a second renderer and a second set of bugs, and a wrong
  drawing is worse than a soft one. The layer is drawn at 2x, so it is
  sharp at reading size.
- The file is named after the source, with `-annotated` before the
  extension, so exporting does not look like overwriting the document.
- Exporting is not free: it reads the source file, copies its pages and
  renders the marks. It is a deliberate act with a button, not something
  that happens on the way out.
- The rasterisation in 0012 is still the right call for the canvas. This
  does not argue against it — it argues that the cost of it is a cost of
  the canvas, and that the document itself never had to be thrown away.
- The wider account of how this repository was worked on, and what the
  process had to become to be trustworthy, is in
  [safeguards.md](../safeguards.md). This is one decision inside it.
