import { expect, test } from "bun:test"

import { brackets } from "./crop-shape-util"

test("the crop draws a bracket at each corner", () => {
  expect(brackets(100, 100).match(/M /g)).toHaveLength(4)
})

test("the brackets shrink on a small crop so they do not overrun it", () => {
  expect(brackets(100, 100)).toContain("L 20 0")
  expect(brackets(10, 10)).toContain("L 5 0")
  expect(brackets(4, 4)).toContain("L 2 0")
})
