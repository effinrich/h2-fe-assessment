// Shell hook for Cursor (`beforeShellExecution`) and Claude Code (`PreToolUse`, Bash).
// Denies commands that skip the git hooks, so the commit and push gates hold.
import { readFileSync } from "node:fs"

let input = {}
try {
  input = JSON.parse(readFileSync(0, "utf8") || "{}")
} catch {
  // No or malformed payload: nothing to check.
}

const command = input.command ?? input.tool_input?.command ?? ""
const bypass =
  /--no-verify\b|\bLEFTHOOK\s*=\s*["']?0|\$env:LEFTHOOK\s*=\s*["']?0|\bgit\s+commit\b[^|;&]*\s-[a-zA-Z]*n[a-zA-Z]*\b/

if (bypass.test(command)) {
  const reason =
    "Skipping git hooks is not allowed here. Fix what the hook reports, then commit or push normally."
  process.stdout.write(
    JSON.stringify({ permission: "deny", user_message: reason, agent_message: reason })
  )
  process.stderr.write(reason)
  process.exit(2)
}

process.stdout.write(JSON.stringify({ permission: "allow" }))
