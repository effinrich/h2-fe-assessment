import { expect, test } from "bun:test"

import type { CanvasExtension } from "./types"

import { PDF_PAGE_GAP, VIEWER_OVERRIDES } from "./consts"
import {
  activePageNumber,
  hasUserMarks,
  isPdfPageShape,
  mergeCanvasExtensions,
  pageBounds
} from "./utils"

const pages = [
  { pageNumber: 1, width: 600, height: 800, src: "" },
  { pageNumber: 2, width: 600, height: 900, src: "" }
]

test("a page sits where it was placed, with a gap between pages", () => {
  expect(pageBounds(pages, 1)).toEqual({ x: 0, y: 0, w: 600, h: 800 })
  expect(pageBounds(pages, 2)).toEqual({ x: 0, y: 800 + PDF_PAGE_GAP, w: 600, h: 900 })
  expect(pageBounds(pages, 3)).toBeUndefined()
})

test("the page under the viewport is the active one", () => {
  expect(activePageNumber(pages, { x: 0, y: 0, w: 600, h: 800 })).toBe(1)
  expect(activePageNumber(pages, { x: 0, y: 840, w: 600, h: 900 })).toBe(2)
})

test("a viewport over nothing is still on the first page", () => {
  expect(activePageNumber(pages, { x: 0, y: 5000, w: 10, h: 10 })).toBe(1)
})

test("a document with only pages on it has no marks", () => {
  expect(hasUserMarks([{ id: "shape:page-1" }, { id: "shape:page-2" }])).toBe(false)
  expect(hasUserMarks([{ id: "shape:page-1" }, { id: "shape:abc" }])).toBe(true)
})

test("a page shape is an image shape with a page id", () => {
  expect(isPdfPageShape({ id: "shape:page-1", type: "image" })).toBe(true)
  expect(isPdfPageShape({ id: "shape:page-1", type: "geo" })).toBe(false)
  expect(isPdfPageShape({ id: "shape:other", type: "image" })).toBe(false)
})

test("the extensions are merged into one set of capabilities", () => {
  const first: CanvasExtension = { toolIds: ["pin"], nonDocumentShapeTypes: ["crop"] }
  const second: CanvasExtension = { toolIds: ["camera"], nonDocumentShapeTypes: ["frame"] }

  const merged = mergeCanvasExtensions([first, second])

  expect(merged.toolIds).toEqual(["pin", "camera"])
  expect(merged.nonDocumentShapeTypes).toEqual(["crop", "frame"])
  expect(merged.shapeUtils).toEqual([])
  expect(merged.bindingUtils).toEqual([])
})

test("the viewer's own overrides come last", () => {
  const merged = mergeCanvasExtensions([
    { overrides: { translations: { en: { "some.label": "Some label" } } } }
  ])
  expect(merged.overrides).toHaveLength(2)
  expect(merged.overrides[merged.overrides.length - 1]).toBe(VIEWER_OVERRIDES)
})
