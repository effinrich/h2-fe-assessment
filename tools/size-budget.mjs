// Fails when tracked source in apps/ and libs/ outgrows its budget.
// Raising a limit is a deliberate, reviewed change to this file.
import { execFileSync } from "node:child_process"
import { readFileSync } from "node:fs"

const MAX_FILES = 95
const MAX_LINES = 3300

const files = execFileSync("git", ["ls-files", "apps", "libs"], { encoding: "utf8" })
  .split("\n")
  .filter((file) => /\.(ts|tsx|css)$/.test(file))

const lines = files.reduce(
  (total, file) =>
    total +
    readFileSync(file, "utf8")
      .split("\n")
      .filter((line) => line.trim() !== "").length,
  0
)

console.log(
  `size budget: ${files.length}/${MAX_FILES} files, ${lines}/${MAX_LINES} non-blank lines`
)

if (files.length > MAX_FILES || lines > MAX_LINES) {
  console.error("Over budget. Cut scope first; raise the limit only as a reviewed decision.")
  process.exit(1)
}
