// Fails when tracked source in apps/ and libs/ outgrows its budget.
// Raising a limit is a deliberate, reviewed change to this file.
//
// The product budget and the test budget are counted separately: the first
// bounds what ships, the second bounds the suite that verifies it. A test
// file does not cost a line of product code, and the suite is bounded too,
// so the split is a bound rather than a hole.
import { execFileSync } from "node:child_process"
import { readFileSync } from "node:fs"

const MAX_FILES = 95
const MAX_LINES = 3300
const MAX_TEST_FILES = 12
const MAX_TEST_LINES = 400

const SOURCE = /\.(ts|tsx|css)$/
const TEST_FILE = /\.(test|spec)\.[jt]sx?$/

const files = execFileSync("git", ["ls-files", "apps", "libs"], { encoding: "utf8" })
  .split("\n")
  .filter((file) => SOURCE.test(file))

const count = (list) =>
  list.reduce(
    (total, file) =>
      total +
      readFileSync(file, "utf8")
        .split("\n")
        .filter((line) => line.trim() !== "").length,
    0
  )

const product = files.filter((file) => !TEST_FILE.test(file))
const tests = files.filter((file) => TEST_FILE.test(file))

const productLines = count(product)
const testLines = count(tests)

console.log(
  `size budget: ${product.length}/${MAX_FILES} files, ${productLines}/${MAX_LINES} non-blank lines`
)
console.log(
  `test budget: ${tests.length}/${MAX_TEST_FILES} files, ${testLines}/${MAX_TEST_LINES} non-blank lines`
)

if (
  product.length > MAX_FILES ||
  productLines > MAX_LINES ||
  tests.length > MAX_TEST_FILES ||
  testLines > MAX_TEST_LINES
) {
  console.error("Over budget. Cut scope first; raise the limit only as a reviewed decision.")
  process.exit(1)
}
