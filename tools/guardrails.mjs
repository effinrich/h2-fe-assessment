#!/usr/bin/env node
// Checks that the safeguards this repository depends on are still in place.
//
// An agent can delete a safeguard and rewrite the instruction that told it
// not to, in one commit. Prose does not survive that; a hash and a failing
// check do. This runs inside `bun run gate` and in the Guardrails job, and
// the manifest records what is protected and why.
//
// Node builtins only, and paths resolve from this file rather than the
// working directory, so it runs the same from the repo root, a worktree or
// CI.

import { createHash } from "node:crypto"
import { existsSync, readFileSync } from "node:fs"
import { dirname, join, resolve } from "node:path"
import { fileURLToPath } from "node:url"

const root = resolve(dirname(fileURLToPath(import.meta.url)), "..")
const manifestPath = join(root, "tools/guardrails.manifest.json")
const manifest = JSON.parse(readFileSync(manifestPath, "utf8"))

const problems = []

for (const [path, entry] of Object.entries(manifest.files ?? {})) {
  const full = join(root, path)
  if (!existsSync(full)) {
    problems.push(`protected file is gone: ${path}`)
    continue
  }
  const actual = createHash("sha256").update(readFileSync(full)).digest("hex")
  if (actual !== entry.sha256) {
    problems.push(
      `protected file changed: ${path} (expected ${entry.sha256.slice(0, 12)}, got ${actual.slice(0, 12)})`
    )
  }
}

for (const rule of manifest.assertions ?? []) {
  const full = join(root, rule.path)
  if (!existsSync(full)) {
    problems.push(`file with a required invariant is gone: ${rule.path}`)
    continue
  }
  const text = readFileSync(full, "utf8")
  for (const needle of rule.contains ?? []) {
    if (!text.includes(needle)) problems.push(`${rule.path} no longer contains "${needle}"`)
  }
}

for (const [dir, rule] of Object.entries(manifest.directories ?? {})) {
  for (const name of rule.mustExist ?? []) {
    if (!existsSync(join(root, dir, name))) {
      problems.push(`protected file is gone: ${dir}/${name}`)
    }
  }
}

const removed = Object.entries(manifest.removed ?? {})
if (removed.length > 0) {
  console.log("Recorded removals:")
  for (const [path, reason] of removed) console.log(`  ${path} — ${reason}`)
  console.log("")
}

if (problems.length > 0) {
  console.error("Guardrails failed:")
  for (const problem of problems) console.error(`  ${problem}`)
  console.error("")
  console.error(
    "These files are load-bearing. Removing or weakening one is the owner's call and needs an explicit instruction; see AGENTS.md."
  )
  process.exit(1)
}

const fileCount = Object.keys(manifest.files ?? {}).length
const assertionCount = manifest.assertions ?? []
const directoryCount = Object.values(manifest.directories ?? {}).reduce(
  (total, rule) => total + (rule.mustExist ?? []).length,
  0
)
console.log(
  `guardrails: ${fileCount} files, ${assertionCount.length} invariants, ${directoryCount} records — all present`
)
