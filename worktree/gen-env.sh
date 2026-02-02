#!/bin/bash

set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
ROOT_DIR="$(cd "$SCRIPT_DIR/.." && pwd)"
PARENT_DIR="$(cd "$ROOT_DIR/.." && pwd)"
SLOTS_FILE="$PARENT_DIR/worktree-slots.toml"
WORKTREE_ENV="$ROOT_DIR/.worktree.env"

BASE_API_PORT=8000
BASE_WEB_PORT=5173
MAX_SLOT=15

if ! git -C "$ROOT_DIR" rev-parse --is-inside-work-tree >/dev/null 2>&1; then
    echo "ERROR: Not inside a git worktree: $ROOT_DIR"
    exit 1
fi

BRANCH_NAME="$(git -C "$ROOT_DIR" symbolic-ref --quiet --short HEAD 2>/dev/null || true)"
if [ -z "$BRANCH_NAME" ] || [ "$BRANCH_NAME" = "HEAD" ]; then
    BRANCH_NAME="$(git -C "$ROOT_DIR" rev-parse --abbrev-ref HEAD 2>/dev/null || true)"
fi

if [ -z "$BRANCH_NAME" ] || [ "$BRANCH_NAME" = "HEAD" ]; then
    echo "ERROR: Could not determine branch name. Detached HEAD?"
    exit 1
fi

slot=$(python3 - "$SLOTS_FILE" "$BRANCH_NAME" "$MAX_SLOT" <<'PY'
import os
import sys

slots_file = sys.argv[1]
key = sys.argv[2]
max_slot = int(sys.argv[3])

try:
    import tomllib  # Python 3.11+
except Exception:
    print("ERROR_NO_TOMLLIB")
    sys.exit(2)

data = {}
if os.path.exists(slots_file):
    with open(slots_file, "rb") as f:
        data = tomllib.load(f) or {}

worktrees = data.get("worktrees", {})
if key in worktrees:
    print(int(worktrees[key]))
    sys.exit(0)

used = {int(v) for v in worktrees.values()}
slot = next((i for i in range(max_slot + 1) if i not in used), None)

if slot is None:
    print("ERROR_NO_SLOT")
    sys.exit(1)

worktrees[key] = slot
data["worktrees"] = worktrees

os.makedirs(os.path.dirname(slots_file), exist_ok=True)
with open(slots_file, "w", encoding="utf-8") as f:
    f.write("[worktrees]\n")
    for k in sorted(worktrees):
        escaped = str(k).replace("\\", "\\\\").replace('"', '\\"')
        f.write(f"\"{escaped}\" = {int(worktrees[k])}\n")

print(int(slot))
PY
)

if [ "$slot" = "ERROR_NO_TOMLLIB" ]; then
    echo "ERROR: Python tomllib not available. Please use Python 3.11+."
    exit 1
fi

if [ "$slot" = "ERROR_NO_SLOT" ]; then
    echo "ERROR: No available port slots (0-$MAX_SLOT)."
    echo "   Free a slot or increase MAX_SLOT in worktree/gen-env.sh."
    exit 1
fi

if [ -z "$slot" ]; then
    echo "ERROR: Failed to determine worktree slot."
    exit 1
fi

API_PORT=$((BASE_API_PORT + slot))
WEB_PORT=$((BASE_WEB_PORT + slot))
API_URL="http://localhost:${API_PORT}"
APP_URL="http://localhost:${WEB_PORT}"

cat > "$WORKTREE_ENV" <<EOF
WORKTREE_SLOT=${slot}
API_PORT=${API_PORT}
WEB_PORT=${WEB_PORT}
API_URL=${API_URL}
APP_URL=${APP_URL}
EOF

if [ "${WORKTREE_ENV_VERBOSE:-0}" = "1" ]; then
    echo "Updated .worktree.env (slot ${slot})"
fi
