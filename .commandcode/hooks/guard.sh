#!/usr/bin/env bash
# PreToolUse guard: deny destructive shell commands before they run, and tell the
# model why so it does not retry the same pattern.
set -uo pipefail

cmd=$(printf '%s' "$(cat)" | jq -r '.tool_input.command // ""')

pattern='rm[[:space:]]+-[rR]f?[[:space:]]+/($|[[:space:]])'
pattern+='|rm[[:space:]]+-[rR]f?[[:space:]]+~'
pattern+='|curl.*\|.*(sh|bash)'
pattern+='|:\(\)[[:space:]]*\{'
pattern+='|git push --force'
pattern+='|git reset --hard'

if printf '%s' "$cmd" | grep -qE "$pattern"; then
  jq -n --arg cmd "$cmd" '{
    systemMessage: "blocked a destructive command",
    hookSpecificOutput: {
      hookEventName: "PreToolUse",
      permissionDecision: "deny",
      permissionDecisionReason: ("Project policy forbids this command. Rewrite without it: " + ($cmd | .[0:120]))
    }
  }'
fi

exit 0
