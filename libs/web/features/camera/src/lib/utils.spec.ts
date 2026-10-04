import { createShapeId, getIndexAbove, type IndexKey } from "tldraw"
import { describe, expect, it } from "vitest"

import type { ExportCandidate } from "./types"

import { CROP_FRAME, MAX_EXPORT_AREA_PX, MAX_EXPORT_SIDE_PX } from "./consts"
import {
  buildExportFilename,
  cropToolbarAnchor,
  defaultFrameBox,
  exportPixelRatio,
  exportPixelSize,
  exportShapeIds,
  frameInsertIndex,
  isBelowMinSize,
  normaliseBox
} from "./utils"

const id = createShapeId

describe("normaliseBox", () => {
  const expected = { x: 100, y: 100, w: 300, h: 200 }

  it.each([
    ["down-right", { x: 100, y: 100 }, { x: 400, y: 300 }],
    ["up-left", { x: 400, y: 300 }, { x: 100, y: 100 }],
    ["down-left", { x: 400, y: 100 }, { x: 100, y: 300 }],
    ["up-right", { x: 100, y: 300 }, { x: 400, y: 100 }]
  ])("gives the same box for a %s drag", (_direction, origin, current) => {
    expect(normaliseBox(origin, current)).toEqual(expected)
  })

  it("gives a zero-size box for a click", () => {
    expect(normaliseBox({ x: 5, y: 5 }, { x: 5, y: 5 })).toEqual({ x: 5, y: 5, w: 0, h: 0 })
  })
})

describe("defaultFrameBox", () => {
  it("is 300×200 screen px centred in the viewport", () => {
    const viewport = { x: 50, y: -20, w: 1000, h: 800 }
    expect(defaultFrameBox(viewport, 1)).toEqual({ x: 400, y: 280, w: 300, h: 200 })
  })

  it("divides the screen size by the zoom", () => {
    const viewport = { x: 0, y: 0, w: 500, h: 400 }
    expect(defaultFrameBox(viewport, 2)).toEqual({ x: 175, y: 150, w: 150, h: 100 })
  })

  it("caps each side at 80% of the viewport", () => {
    const viewport = { x: 0, y: 0, w: 250, h: 150 }
    expect(defaultFrameBox(viewport, 1)).toEqual({ x: 25, y: 15, w: 200, h: 120 })
  })
})

describe("isBelowMinSize", () => {
  it("rejects a box under 16 screen pixels on either side", () => {
    expect(isBelowMinSize({ x: 0, y: 0, w: 15, h: 200 }, 1)).toBe(true)
    expect(isBelowMinSize({ x: 0, y: 0, w: 200, h: 15 }, 1)).toBe(true)
  })

  it("accepts a box of exactly 16 screen pixels", () => {
    expect(isBelowMinSize({ x: 0, y: 0, w: 16, h: 16 }, 1)).toBe(false)
  })

  it("measures on screen, so zoom changes the page-unit threshold", () => {
    // 10 page units is 20 screen pixels at 2x zoom; 24 is 12 at 0.5x.
    expect(isBelowMinSize({ x: 0, y: 0, w: 10, h: 10 }, 2)).toBe(false)
    expect(isBelowMinSize({ x: 0, y: 0, w: 24, h: 24 }, 0.5)).toBe(true)
  })
})

const A0 = getIndexAbove()
const A1 = getIndexAbove(A0)
const A2 = getIndexAbove(A1)

// Index keys sort as plain strings.
const isBetween = (index: IndexKey | undefined, below: string, above: string) =>
  index !== undefined && index > below && index < above

describe("frameInsertIndex", () => {
  it("goes between the background and the lowest mark", () => {
    const index = frameInsertIndex([
      { index: A0, isMark: false },
      { index: A1, isMark: true },
      { index: A2, isMark: true }
    ])

    expect(isBetween(index, A0, A1)).toBe(true)
  })

  it("goes above existing frames and below the marks", () => {
    const index = frameInsertIndex([
      { index: A0, isMark: false },
      { index: A1, isMark: false },
      { index: A2, isMark: true }
    ])

    expect(isBetween(index, A1, A2)).toBe(true)
  })

  it("goes below a mark at the very bottom", () => {
    const index = frameInsertIndex([{ index: A1, isMark: true }])

    expect(isBetween(index, "", A1)).toBe(true)
  })

  it("leaves the default (on top) when there are no marks", () => {
    expect(frameInsertIndex([{ index: A0, isMark: false }])).toBeUndefined()
    expect(frameInsertIndex([])).toBeUndefined()
  })
})

describe("cropToolbarAnchor", () => {
  const viewport = { x: 0, y: 0, w: 1000, h: 800 }
  // Toolbar 48 + gap 8 + margin 16: a frame top under 72 px has no room above.
  const sizes = { toolbarHeight: 48, labelHeight: 24 }

  it("keeps the selection when there is room above", () => {
    const selection = { x: 100, y: 72, w: 300, h: 200 }

    expect(cropToolbarAnchor({ selection, viewport, ...sizes })).toEqual(selection)
  })

  it("anchors below the label when there is no room above", () => {
    const selection = { x: 100, y: 71, w: 300, h: 200 }

    // Label bottom 71 + 200 + 24 = 295; tldraw puts the toolbar at y − 48 − 8.
    expect(cropToolbarAnchor({ selection, viewport, ...sizes })).toEqual({
      x: 100,
      y: 295 + 48 + 8,
      w: 300,
      h: 0
    })
  })

  it("measures room from the viewport, not the page origin", () => {
    const offset = { ...viewport, x: 50, y: 40 }
    const selection = { x: 150, y: 50, w: 300, h: 200 }

    expect(cropToolbarAnchor({ selection, viewport: offset, ...sizes }).h).toBe(0)
  })

  it("keeps the selection when there is no room below either", () => {
    const selection = { x: 100, y: 10, w: 300, h: 700 }

    expect(cropToolbarAnchor({ selection, viewport, ...sizes })).toEqual(selection)
  })

  it("keeps the selection when its centre is off screen, so tldraw hides the toolbar", () => {
    const selection = { x: 100, y: -500, w: 300, h: 200 }

    expect(cropToolbarAnchor({ selection, viewport, ...sizes })).toEqual(selection)
  })
})

describe("exportShapeIds", () => {
  const frame = { x: 100, y: 100, w: 300, h: 200 }

  it("keeps shapes that overlap the frame, in the given z-order", () => {
    const candidates: ExportCandidate[] = [
      { id: id("back"), type: "geo", bounds: { x: 150, y: 150, w: 50, h: 50 } },
      { id: id("outside"), type: "geo", bounds: { x: 600, y: 600, w: 50, h: 50 } },
      { id: id("partly-in"), type: "geo", bounds: { x: 350, y: 250, w: 200, h: 200 } },
      { id: id("front"), type: "geo", bounds: { x: 120, y: 120, w: 20, h: 20 } }
    ]

    expect(exportShapeIds(frame, candidates)).toEqual([id("back"), id("partly-in"), id("front")])
  })

  it("excludes every crop frame, including the one being exported", () => {
    const candidates: ExportCandidate[] = [
      { id: id("self"), type: CROP_FRAME, bounds: frame },
      { id: id("rect"), type: "geo", bounds: { x: 150, y: 150, w: 50, h: 50 } },
      { id: id("other-frame"), type: CROP_FRAME, bounds: { x: 200, y: 200, w: 300, h: 300 } }
    ]

    expect(exportShapeIds(frame, candidates)).toEqual([id("rect")])
  })

  it("ignores shapes that only touch the frame's edge, or have no bounds", () => {
    const candidates: ExportCandidate[] = [
      { id: id("touching-right"), type: "geo", bounds: { x: 400, y: 150, w: 50, h: 50 } },
      { id: id("touching-top"), type: "geo", bounds: { x: 150, y: 50, w: 50, h: 50 } },
      { id: id("unbounded"), type: "group", bounds: undefined }
    ]

    expect(exportShapeIds(frame, candidates)).toEqual([])
  })

  it("is empty for a frame over nothing", () => {
    expect(exportShapeIds(frame, [])).toEqual([])
  })
})

describe("exportPixelRatio", () => {
  it("is 2 for an ordinary frame", () => {
    expect(exportPixelRatio({ w: 300, h: 200 })).toBe(2)
  })

  it("stays 2 when the longest side lands exactly on the limit", () => {
    expect(exportPixelRatio({ w: MAX_EXPORT_SIDE_PX / 2, h: 100 })).toBe(2)
  })

  it("scales down so the longest side fits the limit", () => {
    const ratio = exportPixelRatio({ w: 6000, h: 1000 })

    expect(ratio).toBeCloseTo(MAX_EXPORT_SIDE_PX / 6000)
    expect(6000 * ratio).toBeLessThanOrEqual(MAX_EXPORT_SIDE_PX)
  })

  it("uses the longest side whichever way round the frame is", () => {
    expect(exportPixelRatio({ w: 1000, h: 8192 })).toBe(1)
  })

  it("stays 2 when the area lands exactly on the budget", () => {
    expect(exportPixelRatio({ w: 2048, h: 2048 })).toBe(2)
  })

  it("scales down so the area fits the budget when no side is too long", () => {
    const ratio = exportPixelRatio({ w: 3000, h: 3000 })

    expect(ratio).toBeCloseTo(4096 / 3000)
    expect(3000 * ratio * 3000 * ratio).toBeLessThanOrEqual(MAX_EXPORT_AREA_PX + 1e-6)
  })

  it("takes the tighter of the side and area limits", () => {
    expect(exportPixelRatio({ w: 8000, h: 4000 })).toBeCloseTo(Math.sqrt(4096 ** 2 / 32e6))
    expect(exportPixelRatio({ w: 16384, h: 100 })).toBeCloseTo(0.5)
  })
})

describe("exportPixelSize", () => {
  it("is the frame size times the ratio, in whole pixels", () => {
    expect(exportPixelSize({ w: 300, h: 200 }, 2)).toEqual({ width: 600, height: 400 })
  })

  it("rounds down, as the browser canvas does", () => {
    expect(exportPixelSize({ w: 100.4, h: 50.9 }, 2)).toEqual({ width: 200, height: 101 })
  })
})

describe("buildExportFilename", () => {
  const now = new Date(2026, 0, 2, 3, 4, 5)

  it("names the crop after the document, with a zero-padded local timestamp", () => {
    expect(buildExportFilename({ documentName: "q3-report.pdf", now })).toBe(
      "q3-report-crop-20260102-030405"
    )
  })

  it("lower-cases and collapses anything outside [a-z0-9._-] to single dashes", () => {
    expect(buildExportFilename({ documentName: "Q3 Report (Final)!!.PDF", now })).toBe(
      "q3-report-final-crop-20260102-030405"
    )
  })

  it("keeps dots and underscores inside the name", () => {
    expect(buildExportFilename({ documentName: "v1.2_draft.pdf", now })).toBe(
      "v1.2_draft-crop-20260102-030405"
    )
  })

  it("drops accents rather than turning them into dashes", () => {
    expect(buildExportFilename({ documentName: "Résumé.pdf", now })).toBe(
      "resume-crop-20260102-030405"
    )
  })

  it.each([undefined, "", ".pdf", "???.pdf", "  "])("falls back to canvas for %j", (name) => {
    expect(buildExportFilename({ documentName: name, now })).toBe("canvas-crop-20260102-030405")
  })

  it("caps a very long name", () => {
    const filename = buildExportFilename({ documentName: `${"a".repeat(300)}.pdf`, now })

    expect(filename).toBe(`${"a".repeat(100)}-crop-20260102-030405`)
  })
})
