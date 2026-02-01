#!/bin/bash

# Script to remove a git worktree and clear slot assignment
# Usage: ./remove-worktree.sh [-f|--force] <branch-name>

set -e

FORCE=false
BRANCH_NAME=""

while [[ $# -gt 0 ]]; do
    case $1 in
        -f|--force)
            FORCE=true
            shift
            ;;
        -h|--help)
            echo "Usage: $0 [-f|--force] <branch-name>"
            echo ""
            echo "Options:"
            echo "  -f, --force     Force remove (discard untracked/modified files)"
            echo "  -h, --help      Show this help message"
            exit 0
            ;;
        -* )
            echo "❌ Unknown option: $1"
            echo "Use -h or --help for usage information."
            exit 1
            ;;
        * )
            BRANCH_NAME="$1"
            shift
            ;;
    esac
done

if [ -z "$BRANCH_NAME" ]; then
    echo "Usage: $0 [-f|--force] <branch-name>"
    echo "Example: $0 feature/my-branch"
    exit 1
fi


SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PARENT_DIR="$(dirname "$SCRIPT_DIR")"
SLOTS_FILE="$PARENT_DIR/worktree-slots.toml"
DIR_NAME="${BRANCH_NAME//\//-}"
TARGET_WORKTREE="$PARENT_DIR/$DIR_NAME"

remove_slot_assignment() {
    local slots_file="$1"
    local key="$2"
    if [ ! -f "$slots_file" ]; then
        return
    fi

    python3 - "$slots_file" "$key" <<'PY'
import os
import sys

slots_file = sys.argv[1]
key = sys.argv[2]

try:
    import tomllib
except Exception:
    sys.exit(2)

data = {}
with open(slots_file, "rb") as f:
    data = tomllib.load(f) or {}

worktrees = data.get("worktrees", {})
if key not in worktrees:
    sys.exit(0)

del worktrees[key]

with open(slots_file, "w", encoding="utf-8") as f:
    f.write("[worktrees]\n")
    for k in sorted(worktrees):
        escaped = str(k).replace("\\", "\\\\").replace("\"", "\\\"")
        f.write(f"\"{escaped}\" = {int(worktrees[k])}\n")
PY
}

if [ "$TARGET_WORKTREE" = "$SCRIPT_DIR" ]; then
    echo "❌ Refusing to remove the current worktree. Run this from another worktree."
    exit 1
fi

if [ ! -d "$TARGET_WORKTREE" ]; then
    echo "⚠️  Worktree not found: $TARGET_WORKTREE"
    echo "   Removing slot assignment anyway."
    remove_slot_assignment "$SLOTS_FILE" "$BRANCH_NAME"
    exit 0
fi

if [ "$FORCE" = true ]; then
    echo "🗑️  Removing worktree (force): $TARGET_WORKTREE"
    git worktree remove -f "$TARGET_WORKTREE"
else
    echo "🗑️  Removing worktree: $TARGET_WORKTREE"
    git worktree remove "$TARGET_WORKTREE"
fi

remove_slot_assignment "$SLOTS_FILE" "$BRANCH_NAME"
echo "✅ Removed worktree: $BRANCH_NAME"
