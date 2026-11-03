import { expect, test } from "bun:test"
import { Vec, createShapeId, type TLShapeId, type VecModel } from "tldraw"

import { relax } from "./solver"

const S = createShapeId("S")
const S1 = createShapeId("S1")
const S2 = createShapeId("S2")
const S3 = createShapeId("S3")
const P = createShapeId("P")
const P1 = createShapeId("P1")
const P2 = createShapeId("P2")
const L = createShapeId("L")

const neg = (p: VecModel): VecModel => new Vec(-p.x, -p.y, p.z)

/**
 * A network in the shape the binding util builds it: a pin, and the offset
 * from the shape's origin to the point the pin holds it at.
 */
function network(entries: { pin: TLShapeId; shape: TLShapeId; offset: VecModel }[]) {
  const deltas = new Map<TLShapeId, Map<TLShapeId, VecModel>>()
  for (const { pin, shape, offset } of entries) {
    if (!deltas.has(pin)) deltas.set(pin, new Map())
    if (!deltas.has(shape)) deltas.set(shape, new Map())
    deltas.get(pin)!.set(shape, offset)
    deltas.get(shape)!.set(pin, neg(offset))
  }
  return deltas
}

const positions = (entries: [TLShapeId, VecModel][]) => new Map(entries)

/** How far the pin is from the point it is supposed to be holding. */
function anchorError(
  solved: Map<TLShapeId, VecModel>,
  pin: TLShapeId,
  shape: TLShapeId,
  offset: VecModel
): number {
  const p = solved.get(pin)!
  const s = solved.get(shape)!
  return Math.hypot(p.x - s.x - offset.x, p.y - s.y - offset.y)
}

test("a shape that moved stays where it is", () => {
  const solved = relax(
    positions([
      [S, new Vec(10, 0)],
      [P, new Vec(60, 10)]
    ]),
    network([{ pin: P, shape: S, offset: new Vec(50, 10) }]),
    new Set([S])
  )
  expect(solved.get(S)!.x).toBe(10)
  expect(solved.get(S)!.y).toBe(0)
})

test("a shape nothing binds does not move", () => {
  const solved = relax(
    positions([
      [S, new Vec(10, 0)],
      [P, new Vec(60, 10)],
      [L, new Vec(999, 999)]
    ]),
    network([{ pin: P, shape: S, offset: new Vec(50, 10) }]),
    new Set([S])
  )
  expect(solved.get(L)!.x).toBe(999)
  expect(solved.get(L)!.y).toBe(999)
})

test("a pin lands on the point it holds", () => {
  // The shape was dragged ten to the right; the pin follows it to the anchor.
  const solved = relax(
    positions([
      [S, new Vec(10, 0)],
      [P, new Vec(50, 10)]
    ]),
    network([{ pin: P, shape: S, offset: new Vec(50, 10) }]),
    new Set([S])
  )
  expect(anchorError(solved, P, S, new Vec(50, 10))).toBeCloseTo(0, 6)
})

test("two shapes under one pin move together", () => {
  // The brief's case: two overlapping shapes held by one pin, one of them
  // dragged ten to the right, the other carried by the pin.
  const solved = relax(
    positions([
      [S1, new Vec(10, 0)],
      [S2, new Vec(50, 0)],
      [P, new Vec(75, 50)]
    ]),
    network([
      { pin: P, shape: S1, offset: new Vec(75, 50) },
      { pin: P, shape: S2, offset: new Vec(25, 50) }
    ]),
    new Set([S1])
  )
  expect(anchorError(solved, P, S1, new Vec(75, 50))).toBeLessThan(0.01)
  expect(anchorError(solved, P, S2, new Vec(25, 50))).toBeLessThan(0.01)
  // The second shape is carried the same ten the first one moved.
  expect(Math.abs(solved.get(S2)!.x - 60)).toBeLessThan(0.01)
})

test("a chain of shapes through two pins moves with the shape that moved", () => {
  // S1 --P1-- S2 --P2-- S3, with S1 dragged ten to the right.
  //
  // The solver relaxes toward the answer rather than reaching it in one
  // pass, so the far end of the chain lags; the editor runs it again until
  // nothing moves. The tolerances below are the slack this leaves.
  const solved = relax(
    positions([
      [S1, new Vec(10, 0)],
      [S2, new Vec(50, 0)],
      [S3, new Vec(100, 0)],
      [P1, new Vec(60, 10)],
      [P2, new Vec(110, 10)]
    ]),
    network([
      { pin: P1, shape: S1, offset: new Vec(60, 10) },
      { pin: P1, shape: S2, offset: new Vec(10, 10) },
      { pin: P2, shape: S2, offset: new Vec(60, 10) },
      { pin: P2, shape: S3, offset: new Vec(10, 10) }
    ]),
    new Set([S1])
  )

  expect(solved.get(S1)!.x).toBe(10)
  expect(Math.abs(solved.get(S2)!.x - 60)).toBeLessThan(1)
  expect(Math.abs(solved.get(S3)!.x - 110)).toBeLessThan(1.5)

  // Every pin is on the point it holds, to within the slack.
  expect(anchorError(solved, P1, S1, new Vec(60, 10))).toBeLessThan(1)
  expect(anchorError(solved, P1, S2, new Vec(10, 10))).toBeLessThan(1)
  expect(anchorError(solved, P2, S2, new Vec(60, 10))).toBeLessThan(1)
  expect(anchorError(solved, P2, S3, new Vec(10, 10))).toBeLessThan(1)
})
