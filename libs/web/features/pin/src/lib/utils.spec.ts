import type { TLShape, TLShapeId, VecModel } from "tldraw"

import { createShapeId, getIndexAbove } from "tldraw"

import type { PinLink } from "./types"

import { PIN_EPSILON, PIN_TIP } from "./consts"
import {
  ancestorChange,
  badgeLabel,
  classifyChange,
  connectedGroup,
  diffAttachments,
  glyphScale,
  isFar,
  pinOrigin,
  solveGroup
} from "./utils"

const A = createShapeId("a")
const B = createShapeId("b")
const C = createShapeId("c")
const D = createShapeId("d")
const P1 = createShapeId("p1")
const P2 = createShapeId("p2")

function geo(overrides: Partial<TLShape> & { props?: Record<string, unknown> } = {}): TLShape {
  const { props, ...rest } = overrides
  return {
    id: A,
    typeName: "shape",
    type: "geo",
    x: 0,
    y: 0,
    rotation: 0,
    index: "a1",
    parentId: "page:page",
    isLocked: false,
    opacity: 1,
    meta: {},
    props: { w: 200, h: 120, geo: "rectangle", color: "black", ...props },
    ...rest
  } as TLShape
}

function graph(edges: [TLShapeId, TLShapeId][]) {
  return (id: TLShapeId) =>
    edges.flatMap(([from, to]) => (from === id ? [to] : to === id ? [from] : []))
}

describe("pinOrigin", () => {
  it("puts the needle tip of an unrotated pin on the point", () => {
    expect(pinOrigin({ x: 175, y: 90 })).toMatchObject({
      x: 175 - PIN_TIP.x,
      y: 90 - PIN_TIP.y
    })
  })
})

describe("isFar", () => {
  it("compares each axis against epsilon", () => {
    expect(isFar({ x: 0, y: 0 }, { x: PIN_EPSILON, y: PIN_EPSILON })).toBe(false)
    expect(isFar({ x: 0, y: 0 }, { x: 0, y: PIN_EPSILON * 2 })).toBe(true)
    expect(isFar({ x: 0, y: 0 }, { x: 3, y: 0 }, 5)).toBe(false)
  })
})

describe("classifyChange", () => {
  it("treats an x or y change alone as a translation", () => {
    expect(classifyChange(geo(), geo({ x: 10 }))).toBe("translate")
    expect(classifyChange(geo(), geo({ y: -4 }))).toBe("translate")
    expect(classifyChange(geo(), geo({ x: 10, y: 10 }))).toBe("translate")
  })

  it("treats reparenting with unchanged geometry as a translation", () => {
    const framed = geo({ parentId: createShapeId("frame"), x: -40 })
    expect(classifyChange(geo(), framed)).toBe("translate")
  })

  it("treats a resize that also moves the origin as a reshape, not a move", () => {
    expect(classifyChange(geo(), geo({ x: 20, props: { w: 180 } }))).toBe("reshape")
  })

  it("treats a rotation as a reshape", () => {
    expect(classifyChange(geo(), geo({ x: 5, y: 5, rotation: 0.5 }))).toBe("reshape")
  })

  it("ignores changes that cannot move the origin", () => {
    const reordered = geo({ opacity: 0.5, isLocked: true, index: getIndexAbove(geo().index) })
    expect(classifyChange(geo(), reordered)).toBe("none")
    expect(classifyChange(geo(), geo())).toBe("none")
  })

  it("compares props by value, so a replayed record is not a reshape", () => {
    expect(classifyChange(geo(), geo({ x: 3, props: { w: 200 } }))).toBe("translate")
  })
})

describe("ancestorChange", () => {
  it("treats a rotation, with or without a move, as a rotate", () => {
    expect(ancestorChange(geo(), geo({ rotation: 0.5 }))).toBe("rotate")
    expect(ancestorChange(geo(), geo({ x: 5, y: 5, rotation: 0.5 }))).toBe("rotate")
  })

  it("treats x, y or parent changes as a translate, whatever the props do", () => {
    expect(ancestorChange(geo(), geo({ x: 10 }))).toBe("translate")
    expect(ancestorChange(geo(), geo({ parentId: createShapeId("frame") }))).toBe("translate")
    expect(ancestorChange(geo(), geo({ x: 20, props: { w: 180 } }))).toBe("translate")
  })

  it("ignores a width or height change alone", () => {
    expect(ancestorChange(geo(), geo({ props: { w: 300, h: 40 } }))).toBe("none")
    expect(ancestorChange(geo(), geo({ opacity: 0.5 }))).toBe("none")
  })
})

describe("connectedGroup", () => {
  it("follows chains across pins", () => {
    const neighbours = graph([
      [P1, A],
      [P1, B],
      [P2, B],
      [P2, C]
    ])
    expect(connectedGroup(A, neighbours)).toEqual(new Set([A, P1, B, P2, C]))
  })

  it("terminates on cycles", () => {
    const neighbours = graph([
      [P1, A],
      [P1, B],
      [P2, A],
      [P2, B]
    ])
    expect(connectedGroup(B, neighbours)).toEqual(new Set([B, P1, A, P2]))
  })

  it("returns just the seed when it is isolated", () => {
    expect(connectedGroup(D, graph([[P1, A]]))).toEqual(new Set([D]))
  })
})

describe("diffAttachments", () => {
  it("splits current vs eligible into create and remove", () => {
    expect(diffAttachments([A, B], [B, C])).toEqual({ create: [C], remove: [A] })
  })

  it("is empty-handed for an empty canvas", () => {
    expect(diffAttachments([], [])).toEqual({ create: [], remove: [] })
  })

  it("detaches everything when nothing is eligible", () => {
    expect(diffAttachments([A, B], [])).toEqual({ create: [], remove: [A, B] })
  })

  it("ignores duplicate eligible ids", () => {
    expect(diffAttachments([], [A, A, B])).toEqual({ create: [A, B], remove: [] })
  })
})

describe("solveGroup", () => {
  // P1 at (175, 90) holds A (origin 0,0) and B (origin 150,60).
  const links: PinLink[] = [
    { pinId: P1, shapeId: A, offset: { x: -175, y: -90 } },
    { pinId: P1, shapeId: B, offset: { x: -25, y: -30 } }
  ]

  it("moves the pin and the other members rigidly with the driver", () => {
    const targets = solveGroup(
      A,
      links,
      new Map<TLShapeId, VecModel>([
        [A, { x: 100, y: 50 }],
        [P1, { x: 175, y: 90 }],
        [B, { x: 150, y: 60 }]
      ])
    )
    expect(Object.fromEntries(targets)).toEqual({
      [P1]: { x: 275, y: 140 },
      [B]: { x: 250, y: 110 }
    })
  })

  it("never returns the driver itself", () => {
    const targets = solveGroup(
      A,
      links,
      new Map<TLShapeId, VecModel>([
        [A, { x: 100, y: 50 }],
        [P1, { x: 175, y: 90 }],
        [B, { x: 150, y: 60 }]
      ])
    )
    expect(targets.has(A)).toBe(false)
  })

  it("skips members already within epsilon of their target (no double move)", () => {
    const targets = solveGroup(
      A,
      links,
      new Map<TLShapeId, VecModel>([
        [A, { x: 40, y: 0 }],
        [P1, { x: 215, y: 90 }],
        [B, { x: 190.005, y: 60 }]
      ])
    )
    expect(targets.size).toBe(0)
  })

  it("solves transitive groups through a second pin", () => {
    const chain: PinLink[] = [
      ...links,
      { pinId: P2, shapeId: B, offset: { x: -100, y: -50 } },
      { pinId: P2, shapeId: C, offset: { x: -10, y: -20 } }
    ]
    const targets = solveGroup(
      A,
      chain,
      new Map<TLShapeId, VecModel>([
        [A, { x: 10, y: 0 }],
        [P1, { x: 175, y: 90 }],
        [B, { x: 150, y: 60 }],
        [P2, { x: 250, y: 110 }],
        [C, { x: 240, y: 90 }]
      ])
    )
    expect(Object.fromEntries(targets)).toEqual({
      [P1]: { x: 185, y: 90 },
      [B]: { x: 160, y: 60 },
      [P2]: { x: 260, y: 110 },
      [C]: { x: 250, y: 90 }
    })
  })

  it("lets the first path win when offsets in a cycle disagree", () => {
    const cycle: PinLink[] = [
      { pinId: P1, shapeId: A, offset: { x: -10, y: 0 } },
      { pinId: P1, shapeId: B, offset: { x: 10, y: 0 } },
      { pinId: P2, shapeId: A, offset: { x: -20, y: 0 } },
      { pinId: P2, shapeId: B, offset: { x: 99, y: 0 } }
    ]
    const targets = solveGroup(
      A,
      cycle,
      new Map<TLShapeId, VecModel>([
        [A, { x: 0, y: 0 }],
        [P1, { x: 0, y: 0 }],
        [B, { x: 0, y: 0 }],
        [P2, { x: 0, y: 0 }]
      ])
    )
    expect(targets.get(B)).toEqual({ x: 20, y: 0 })
  })

  it("skips members with no known position", () => {
    const targets = solveGroup(
      A,
      links,
      new Map<TLShapeId, VecModel>([
        [A, { x: 100, y: 50 }],
        [P1, { x: 175, y: 90 }]
      ])
    )
    expect([...targets.keys()]).toEqual([P1])
  })
})

describe("badgeLabel", () => {
  it("shows no badge below two held shapes", () => {
    expect(badgeLabel(0)).toBeNull()
    expect(badgeLabel(1)).toBeNull()
  })

  it("shows the count, capped at 9+", () => {
    expect(badgeLabel(2)).toBe("2")
    expect(badgeLabel(9)).toBe("9")
    expect(badgeLabel(10)).toBe("9+")
  })
})

describe("glyphScale", () => {
  it("draws at page size from 50% zoom up", () => {
    expect(glyphScale(0.5)).toBe(1)
    expect(glyphScale(1)).toBe(1)
    expect(glyphScale(4)).toBe(1)
  })

  it("holds the 50% screen size below that", () => {
    expect(glyphScale(0.25)).toBe(2)
    expect(glyphScale(0.1)).toBeCloseTo(5)
  })
})
