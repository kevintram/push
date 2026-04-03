#!/bin/bash

# Script to remove a git worktree and clear slot assignment
# Usage: ./remove.sh [-f|--force] <branch-name>

set -e

FORCE=false
TARGET_NAME=""

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
            TARGET_NAME="$1"
            shift
            ;;
    esac
done

if [ -z "$TARGET_NAME" ]; then
    echo "Usage: $0 [-f|--force] <branch-name>"
    echo "Example: $0 feature/my-branch"
    exit 1
fi


SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
ROOT_DIR="$(cd "$SCRIPT_DIR/.." && pwd)"
PARENT_DIR="$(cd "$ROOT_DIR/.." && pwd)"
SLOTS_FILE="$PARENT_DIR/worktree-slots.toml"
DIR_NAME="${TARGET_NAME//\//-}"
TARGET_WORKTREE="$PARENT_DIR/$DIR_NAME"

resolve_slot_key() {
    local slots_file="$1"
    local target_name="$2"
    if [ ! -f "$slots_file" ]; then
        return
    fi

    python3 - "$slots_file" "$target_name" <<'PY'
import sys

slots_file = sys.argv[1]
target_name = sys.argv[2]

try:
    import tomllib
except Exception:
    sys.exit(2)

with open(slots_file, "rb") as f:
    data = tomllib.load(f) or {}

worktrees = data.get("worktrees", {})

if target_name in worktrees:
    print(target_name)
    sys.exit(0)

matches = [key for key in worktrees if key.replace("/", "-") == target_name]

if len(matches) == 1:
    print(matches[0])
    sys.exit(0)

if len(matches) > 1:
    print("AMBIGUOUS:" + ",".join(sorted(matches)))
    sys.exit(1)
PY
}

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

SLOT_KEY="$(resolve_slot_key "$SLOTS_FILE" "$TARGET_NAME" || true)"

if [[ "$SLOT_KEY" == AMBIGUOUS:* ]]; then
    echo "❌ Ambiguous worktree name '$TARGET_NAME'. Matches multiple branches:"
    echo "   ${SLOT_KEY#AMBIGUOUS:}"
    echo "   Re-run remove.sh with the full branch name."
    exit 1
fi

if [ -z "$SLOT_KEY" ]; then
    SLOT_KEY="$TARGET_NAME"
fi

if [ "$TARGET_WORKTREE" = "$ROOT_DIR" ]; then
    echo "❌ Refusing to remove the current worktree. Run this from another worktree."
    exit 1
fi

if [ ! -d "$TARGET_WORKTREE" ]; then
    echo "⚠️  Worktree not found: $TARGET_WORKTREE"
    if [ -f "$SLOTS_FILE" ] && grep -q "\"${SLOT_KEY//\//\\/}\"" "$SLOTS_FILE" 2>/dev/null; then
        echo "   Removing slot assignment anyway."
        remove_slot_assignment "$SLOTS_FILE" "$SLOT_KEY"
    fi
    exit 0
fi

if [ "$FORCE" = true ]; then
    echo "🗑️  Removing worktree (force): $TARGET_WORKTREE"
    if ! git worktree remove -f "$TARGET_WORKTREE"; then
        echo "❌ Failed to remove worktree. Slot assignment kept."
        exit 1
    fi
else
    echo "🗑️  Removing worktree: $TARGET_WORKTREE"
    if ! git worktree remove "$TARGET_WORKTREE"; then
        echo "❌ Failed to remove worktree (use -f to force). Slot assignment kept."
        exit 1
    fi
fi

remove_slot_assignment "$SLOTS_FILE" "$SLOT_KEY"
echo "✅ Removed worktree: $SLOT_KEY"
