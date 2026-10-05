#!/usr/bin/env bash
# Stop hook: run the gates at end of turn and block the turn with the failures.
# Definition: the assistant cannot finish a turn while the repo is broken.
set -uo pipefail

INPUT=$(cat)

# Canonical loop guard. On the retry fire, let the turn end so a broken gate
# cannot trap the session in a retry loop.
if [ "$(printf '%s' "$INPUT" | jq -r '.stop_hook_active')" = "true" ]; then
  exit 0
fi

# Nothing to check if the working tree is clean.
if [ -z "$(git status --porcelain 2>/dev/null)" ]; then
  exit 0
fi

if ! OUT=$(bun run gate 2>&1); then
  {
    echo "Gates failed. Fix these before finishing:"
    printf '%s\n' "$OUT" | tail -40
  } >&2
  exit 2   # stderr reaches the model verbatim
fi

exit 0
