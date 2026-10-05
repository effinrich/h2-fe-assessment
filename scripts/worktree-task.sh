#!/usr/bin/env bash
# ==============================================================================
# worktree-task.sh - Task Worktree Isolation for AI Agents & Developers
# ==============================================================================
# This script manages temporary git worktrees for isolated task execution.
# Isolating tasks in worktrees prevents destructive or experimental changes from
# affecting the primary checkout.
#
# Usage:
#   scripts/worktree-task.sh create <task-name> [base-branch]
#   scripts/worktree-task.sh list
#   scripts/worktree-task.sh clean <task-name> [--force|-f] [--delete-branch|-b]
#   scripts/worktree-task.sh clean --all [--force|-f] [--delete-branch|-b]
#   scripts/worktree-task.sh help
#
# Execution:
#   Unix (Linux/macOS): ./scripts/worktree-task.sh <command>
#   Windows (Git Bash): bash scripts/worktree-task.sh <command>
#   Windows (PowerShell): & "C:\Program Files\Git\bin\bash.exe" scripts/worktree-task.sh <command>
# ==============================================================================

set -euo pipefail

# ANSI color codes for formatted output (disabled if NO_COLOR is set or non-interactive)
if [ -t 1 ] && [ -z "${NO_COLOR:-}" ]; then
  BOLD='\033[1m'
  GREEN='\033[0;32m'
  YELLOW='\033[0;33m'
  RED='\033[0;31m'
  BLUE='\033[0;34m'
  RESET='\033[0m'
else
  BOLD=''
  GREEN=''
  YELLOW=''
  RED=''
  BLUE=''
  RESET=''
fi

log_info() {
  echo -e "${BLUE}[INFO]${RESET} $*"
}

log_success() {
  echo -e "${GREEN}[SUCCESS]${RESET} $*"
}

log_warn() {
  echo -e "${YELLOW}[WARN]${RESET} $*"
}

log_error() {
  echo -e "${RED}[ERROR]${RESET} $*" >&2
}

# Resolve repository root
get_repo_root() {
  git rev-parse --show-toplevel 2>/dev/null || {
    log_error "Not inside a git repository."
    exit 1
  }
}

# Print usage information
show_help() {
  cat << EOF
${BOLD}Usage:${RESET}
  scripts/worktree-task.sh <command> [options] [arguments]

${BOLD}Description:${RESET}
  Manages isolated git worktrees for agent tasks or isolated experiments.
  Worktrees are created inside the '.worktrees/' directory at the repo root.

${BOLD}Commands:${RESET}
  ${GREEN}create <task-name> [base-branch]${RESET}
      Create a new git worktree for a task.
      - Branch defaults to 'task/<task-name>'.
      - Base branch defaults to current branch (or HEAD).

  ${GREEN}list${RESET} (or ${GREEN}ls${RESET})
      List all active task worktrees in '.worktrees/'.

  ${GREEN}clean <task-name> [options]${RESET}
      Remove a task worktree safely.
      Options:
        ${YELLOW}-f, --force${RESET}          Force remove worktree even with uncommitted changes.
        ${YELLOW}-b, --delete-branch${RESET}  Delete the associated branch ('task/<task-name>') after removal.

  ${GREEN}clean --all [options]${RESET}
      Remove all active task worktrees in '.worktrees/'.
      Options:
        ${YELLOW}-f, --force${RESET}          Force remove all worktrees with uncommitted changes.
        ${YELLOW}-b, --delete-branch${RESET}  Delete associated task branches after removal.

  ${GREEN}help${RESET} (or ${GREEN}-h${RESET}, ${GREEN}--help${RESET})
      Show this help message.

${BOLD}Examples:${RESET}
  # Create a worktree for task "add-feature-x"
  scripts/worktree-task.sh create add-feature-x

  # Create a worktree based on main branch
  scripts/worktree-task.sh create fix-bug-y main

  # List active task worktrees
  scripts/worktree-task.sh list

  # Remove a worktree safely
  scripts/worktree-task.sh clean add-feature-x

  # Force remove a worktree and delete its branch
  scripts/worktree-task.sh clean add-feature-x -f -b

  # Clean all task worktrees
  scripts/worktree-task.sh clean --all -f

${BOLD}Execution Notes:${RESET}
  - Linux / macOS:  ./scripts/worktree-task.sh create <task-name>
  - Windows Bash:   bash scripts/worktree-task.sh create <task-name>
  - PowerShell:     & "C:\Program Files\Git\bin\bash.exe" scripts/worktree-task.sh create <task-name>
EOF
}

# Sanitize task name (remove leading slashes, path traversals, etc.)
clean_task_name() {
  local raw_name="$1"
  # Strip leading .worktrees/ or task/ if provided
  raw_name="${raw_name#.worktrees/}"
  raw_name="${raw_name#task/}"
  # Remove invalid characters (keep alphanumeric, -, _, /)
  echo "$raw_name" | sed -e 's/[^a-zA-Z0-9_\/-]/_/g' -e 's/^\///' -e 's/\/$//'
}

cmd_create() {
  if [ $# -lt 1 ] || [ -z "$1" ]; then
    log_error "Missing task name."
    echo "Usage: scripts/worktree-task.sh create <task-name> [base-branch]"
    exit 1
  fi

  local raw_task_name="$1"
  local task_name
  task_name="$(clean_task_name "$raw_task_name")"
  local base_branch="${2:-HEAD}"

  if [ -z "$task_name" ]; then
    log_error "Invalid task name: '$raw_task_name'"
    exit 1
  fi

  local repo_root
  repo_root="$(get_repo_root)"
  local worktree_base_dir="$repo_root/.worktrees"
  local worktree_dir="$worktree_base_dir/$task_name"
  local branch_name="task/$task_name"

  if [ -d "$worktree_dir" ]; then
    log_error "Worktree directory already exists: $worktree_dir"
    log_info "To clean it up first, run: scripts/worktree-task.sh clean $task_name"
    exit 1
  fi

  mkdir -p "$worktree_base_dir"

  log_info "Creating task worktree..."
  log_info "  Task Name:   $task_name"
  log_info "  Worktree:    $worktree_dir"
  log_info "  Branch:      $branch_name"
  log_info "  Base Ref:    $base_branch"

  # Check if branch already exists
  if git show-ref --verify --quiet "refs/heads/$branch_name"; then
    log_warn "Branch '$branch_name' already exists. Attaching worktree to existing branch."
    git worktree add "$worktree_dir" "$branch_name"
  else
    git worktree add -b "$branch_name" "$worktree_dir" "$base_branch"
  fi

  log_success "Worktree created successfully!"
  echo ""
  echo -e "${BOLD}Next steps:${RESET}"
  echo -e "  Enter worktree:     ${GREEN}cd $worktree_dir${RESET}"
  echo -e "  Clean up when done: ${GREEN}scripts/worktree-task.sh clean $task_name${RESET}"
}

cmd_list() {
  local repo_root
  repo_root="$(get_repo_root)"
  local worktree_base_dir="$repo_root/.worktrees"

  log_info "Active task worktrees in repository:"
  echo ""

  local count=0
  local current_path=""
  local current_head=""
  local current_branch=""

  # Parse git worktree list output
  while IFS= read -r line; do
    if [[ "$line" =~ ^worktree\ (.*)$ ]]; then
      current_path="${BASH_REMATCH[1]}"
      current_head=""
      current_branch=""
    elif [[ "$line" =~ ^HEAD\ (.*)$ ]]; then
      current_head="${BASH_REMATCH[1]:0:7}"
    elif [[ "$line" =~ ^branch\ refs/heads/(.*)$ ]]; then
      current_branch="${BASH_REMATCH[1]}"
    elif [[ -z "$line" ]]; then
      if [[ "$current_path" == "$worktree_base_dir"* ]]; then
        count=$((count + 1))
        local task_subpath="${current_path#$worktree_base_dir/}"
        printf "  %b%-20s%b | %-25s | %s [%s]\n" "$BOLD" "$task_subpath" "$RESET" "${current_branch:-detached}" "$current_path" "$current_head"
      fi
    fi
  done < <(git worktree list --porcelain; echo "")

  if [ "$count" -eq 0 ]; then
    log_info "No active task worktrees found in '.worktrees/'."
  else
    echo ""
    log_info "Total active task worktrees: $count"
  fi
}

clean_single_worktree() {
  local repo_root="$1"
  local task_name="$2"
  local force="$3"
  local delete_branch="$4"

  local worktree_dir="$repo_root/.worktrees/$task_name"
  local branch_name="task/$task_name"

  log_info "Cleaning worktree for task '$task_name'..."

  if [ ! -d "$worktree_dir" ]; then
    log_warn "Worktree directory does not exist: $worktree_dir"
  else
    local remove_cmd=(git worktree remove)
    if [ "$force" = true ]; then
      remove_cmd+=(--force)
    fi
    remove_cmd+=("$worktree_dir")

    if "${remove_cmd[@]}"; then
      log_success "Removed worktree directory: $worktree_dir"
    else
      log_error "Failed to remove worktree cleanly."
      if [ "$force" = true ]; then
        log_warn "Force purging directory '$worktree_dir'..."
        rm -rf "$worktree_dir"
      else
        log_info "Use --force (-f) to force remove worktree with uncommitted changes."
        exit 1
      fi
    fi
  fi

  git worktree prune

  if [ "$delete_branch" = true ]; then
    if git show-ref --verify --quiet "refs/heads/$branch_name"; then
      log_info "Deleting branch '$branch_name'..."
      if git branch -D "$branch_name"; then
        log_success "Deleted branch '$branch_name'."
      else
        log_warn "Could not delete branch '$branch_name'."
      fi
    else
      log_info "Branch '$branch_name' does not exist."
    fi
  fi
}

cmd_clean() {
  if [ $# -lt 1 ]; then
    log_error "Missing task name or --all flag."
    echo "Usage: scripts/worktree-task.sh clean <task-name|--all> [-f|--force] [-b|--delete-branch]"
    exit 1
  fi

  local target="$1"
  shift

  local force=false
  local delete_branch=false

  while [ $# -gt 0 ]; do
    case "$1" in
      -f|--force)
        force=true
        shift
        ;;
      -b|--delete-branch)
        delete_branch=true
        shift
        ;;
      *)
        log_error "Unknown option for clean: $1"
        exit 1
        ;;
    esac
  done

  local repo_root
  repo_root="$(get_repo_root)"
  local worktree_base_dir="$repo_root/.worktrees"

  if [ "$target" = "--all" ] || [ "$target" = "-a" ]; then
    if [ ! -d "$worktree_base_dir" ]; then
      log_info "No task worktrees directory found at '.worktrees/'."
      return 0
    fi

    log_info "Cleaning all task worktrees in '$worktree_base_dir'..."
    local cleaned=0
    for dir in "$worktree_base_dir"/*; do
      if [ -d "$dir" ]; then
        local task_name
        task_name="$(basename "$dir")"
        clean_single_worktree "$repo_root" "$task_name" "$force" "$delete_branch"
        cleaned=$((cleaned + 1))
      fi
    done

    if [ "$cleaned" -eq 0 ]; then
      log_info "No worktree directories found to clean."
    else
      log_success "Cleaned $cleaned task worktree(s)."
    fi

    # Remove base directory if empty
    rmdir "$worktree_base_dir" 2>/dev/null || true
  else
    local task_name
    task_name="$(clean_task_name "$target")"
    clean_single_worktree "$repo_root" "$task_name" "$force" "$delete_branch"
  fi
}

main() {
  if [ $# -eq 0 ]; then
    show_help
    exit 0
  fi

  local subcommand="$1"
  shift

  case "$subcommand" in
    create|add|new)
      cmd_create "$@"
      ;;
    list|ls)
      cmd_list "$@"
      ;;
    clean|remove|rm|delete)
      cmd_clean "$@"
      ;;
    help|-h|--help)
      show_help
      ;;
    *)
      log_error "Unknown command: '$subcommand'"
      echo ""
      show_help
      exit 1
      ;;
  esac
}

main "$@"
