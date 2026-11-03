#!/usr/bin/env node
// Checks that the safeguards this repository depends on are still in place.
//
// An agent can delete a safeguard and rewrite the instruction that told it
// not to, in one commit. Prose does not survive that; a hash and a failing
// check do. This runs inside `bun run gate` and in the Guardrails job, and
// the manifest records what is protected and why.
//
// The tracked-file rules derive their inputs from `git ls-files` rather than
// from a list in the manifest, so a new project or a new file is covered the
// moment it is added instead of when someone remembers to add it.
//
// Node builtins only, and paths resolve from this file rather than the
// working directory, so it runs the same from the repo root, a worktree or
// CI.

import { execFileSync } from "node:child_process"
import { createHash } from "node:crypto"
import { existsSync, readFileSync, statSync } from "node:fs"
import { basename, dirname, extname, join, resolve } from "node:path"
import { fileURLToPath } from "node:url"

const root = resolve(dirname(fileURLToPath(import.meta.url)), "..")
const manifestPath = join(root, "tools/guardrails.manifest.json")
const manifest = JSON.parse(readFileSync(manifestPath, "utf8"))

const problems = []

// --- protected files ----------------------------------------------------

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

// --- invariants in files that legitimately change ------------------------

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

// --- the gate runs the checks the repository depends on --------------------
//
// The gate is the verification surface, so what it runs is a decision and not
// a default. A target the repository depends on is required; a target it has
// decided against is forbidden. Both are enforced here rather than left as a
// sentence in a record, because an agent can rewrite the record in the same
// commit that changes the gate.

const gateRule = manifest.gateTargets
if (gateRule) {
  const pkg = JSON.parse(readFileSync(join(root, "package.json"), "utf8"))
  const gate = pkg.scripts?.[gateRule.script] ?? ""
  const match = /nx\s+affected\s+-t\s+([^\s&|]+)/.exec(gate)
  const targets = match ? match[1].split(",").map((t) => t.trim()) : []
  if (targets.length === 0) {
    problems.push(
      `the ${gateRule.script} script does not derive its targets from the project graph`
    )
  }
  for (const target of gateRule.required ?? []) {
    if (!targets.includes(target)) {
      problems.push(
        `the ${gateRule.script} script does not run "${target}" (${gateRule.why ?? ""})`.trim()
      )
    }
  }
  for (const target of gateRule.forbidden ?? []) {
    if (targets.includes(target)) {
      problems.push(
        `the ${gateRule.script} script runs "${target}", which the repository does not use (${gateRule.why ?? ""})`.trim()
      )
    }
  }
}

// --- protected records ---------------------------------------------------

for (const [dir, rule] of Object.entries(manifest.directories ?? {})) {
  for (const name of rule.mustExist ?? []) {
    if (!existsSync(join(root, dir, name))) {
      problems.push(`protected file is gone: ${dir}/${name}`)
    }
  }
}

// --- tracked files -------------------------------------------------------

const tracked = execFileSync("git", ["ls-files", "-z"], { cwd: root, encoding: "utf8" })
  .split("\0")
  .filter(Boolean)

function globToRegExp(pattern) {
  const source = pattern
    .split("**")
    .map((part) => part.replace(/[.+^${}()|[\]\\]/g, "\\$&").replace(/\*/g, "[^/]*"))
    .join(".*")
  return new RegExp(`^${source}$`)
}

const forbidden = (manifest.forbiddenPaths ?? []).map((pattern) => ({
  pattern,
  matcher: globToRegExp(pattern)
}))

for (const path of tracked) {
  for (const rule of forbidden) {
    // Matched against the whole path and against the file name, so a pattern
    // like "*-original" means any depth rather than only the repository root.
    if (rule.matcher.test(path) || rule.matcher.test(basename(path))) {
      problems.push(`tracked file matches a forbidden path pattern: ${path} (${rule.pattern})`)
    }
  }
}

const BINARY_EXTENSIONS = new Set([
  ".mp4",
  ".mov",
  ".webm",
  ".png",
  ".jpg",
  ".jpeg",
  ".gif",
  ".webp",
  ".ico",
  ".pdf",
  ".mp3",
  ".wav",
  ".zip",
  ".gz",
  ".woff",
  ".woff2",
  ".ttf",
  ".otf",
  ".bin"
])

const secretPatterns = (manifest.secretPatterns ?? []).map((rule) => ({
  name: rule.name,
  matcher: new RegExp(rule.pattern)
}))

for (const path of tracked) {
  if (secretPatterns.length === 0) break
  if (BINARY_EXTENSIONS.has(extname(path).toLowerCase())) continue
  const full = join(root, path)
  if (!existsSync(full)) continue
  if (statSync(full).size > 1024 * 1024) continue
  const text = readFileSync(full, "utf8")
  for (const rule of secretPatterns) {
    if (rule.matcher.test(text)) {
      problems.push(`tracked file contains something shaped like a secret: ${path} (${rule.name})`)
    }
  }
}

// --- every project keeps its tags ----------------------------------------
//
// The boundary rule matches on tags, so a project without them is a project
// with no boundary. The list of projects is derived from the tree, not from
// the manifest, so a project added later is covered immediately.

const tagVocabulary = manifest.projectTags ?? {}
const allowedTags = new Set(
  Object.entries(tagVocabulary).flatMap(([key, values]) => values.map((value) => `${key}:${value}`))
)

for (const path of tracked) {
  const isProjectFile = path.endsWith("project.json")
  const isPackageFile = path.endsWith("package.json")
  if (!isProjectFile && !isPackageFile) continue

  let json
  try {
    json = JSON.parse(readFileSync(join(root, path), "utf8"))
  } catch {
    // Skipping an unparseable file would be a check that passes for the wrong
    // reason: the project would look fine because the checker never read it.
    problems.push(`project file could not be parsed: ${path}`)
    continue
  }

  // A project.json is always an Nx project. A package.json is one only when
  // it carries an nx block, and the workspace root never is, even though it
  // carries an nx block of its own.
  if (isPackageFile && (json.nx === undefined || path === "package.json")) continue

  const tags = isProjectFile ? json.tags : json.nx?.tags
  if (!Array.isArray(tags) || tags.length === 0) {
    problems.push(`project has no tags: ${path}`)
    continue
  }
  for (const tag of tags) {
    if (allowedTags.size > 0 && !allowedTags.has(tag)) {
      problems.push(`project has an unknown tag "${tag}": ${path}`)
    }
  }
}

// --- report --------------------------------------------------------------

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
  `guardrails: ${fileCount} files, ${assertionCount.length} invariants, ${directoryCount} records, ` +
    `${tracked.length} tracked files scanned — all present`
)
