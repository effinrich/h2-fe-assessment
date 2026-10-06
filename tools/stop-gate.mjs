// Agent stop hook for Cursor (`stop`) and Claude Code (`Stop`).
// Clean working tree: the turn ends. Otherwise the gate runs; on failure the
// agent is sent back with the tail of the output instead of reporting done.
import { execSync } from "node:child_process"
import { readFileSync } from "node:fs"

let input = {}
try {
  // Cursor on Windows prefixes the payload with a byte-order mark.
  input = JSON.parse(readFileSync(0, "utf8").replace(/^\uFEFF/, "") || "{}")
} catch {
  // No or malformed payload: treat it as a normal completed turn.
}

// Claude Code sets stop_hook_active on the retry it caused; Cursor counts loops.
// Either way the retries are bounded, never an endless loop.
if (input.stop_hook_active || (input.loop_count ?? 0) >= 3) process.exit(0)
if (input.status && input.status !== "completed") process.exit(0)

if (!execSync("git status --porcelain", { encoding: "utf8" }).trim()) process.exit(0)

const gate = process.argv.slice(2).join(" ") || "bun run gate"
try {
  execSync(gate, { stdio: "pipe", encoding: "utf8" })
} catch (error) {
  const output = `${error.stdout ?? ""}${error.stderr ?? ""}`
    .trim()
    .split("\n")
    .slice(-40)
    .join("\n")
  const message = `\`${gate}\` failed. Fix it before reporting done:\n${output}`
  process.stdout.write(
    JSON.stringify({ followup_message: message, decision: "block", reason: message })
  )
}
