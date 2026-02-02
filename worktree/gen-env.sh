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

# Update or append KEY=VALUE in a .env-style file
set_env_var() {
    local file="$1"
    local key="$2"
    local value="$3"
    local tmpfile
    tmpfile="$(mktemp)"
    awk -v key="$key" -v val="$value" '
        BEGIN { found = 0 }
        $0 ~ "^"key"=" { print key"="val; found = 1; next }
        { print }
        END { if (!found) print key"="val }
    ' "$file" > "$tmpfile"
    mv "$tmpfile" "$file"
}

# Create or update apps/api/.env
API_ENV="$ROOT_DIR/apps/api/.env"
if [ ! -f "$API_ENV" ]; then
    if [ -f "$PARENT_DIR/api.env.local" ]; then
        cp "$PARENT_DIR/api.env.local" "$API_ENV"
        echo "Created apps/api/.env"
    else
        echo "WARNING: Template api.env.local not found in $PARENT_DIR and apps/api/.env does not exist"
    fi
fi
if [ -f "$API_ENV" ]; then
    set_env_var "$API_ENV" "APP_URL" "$APP_URL"
    set_env_var "$API_ENV" "API_URL" "$API_URL"
    set_env_var "$API_ENV" "DOMAIN" "localhost"
    set_env_var "$API_ENV" "CORS_ALLOWED_ORIGINS" "$APP_URL"
    if [ "${WORKTREE_ENV_VERBOSE:-0}" = "1" ]; then
        echo "Updated apps/api/.env"
    fi
fi

# Create or update apps/web/.env.local
WEB_ENV="$ROOT_DIR/apps/web/.env.local"
if [ ! -f "$WEB_ENV" ]; then
    if [ -f "$PARENT_DIR/web.env.local" ]; then
        cp "$PARENT_DIR/web.env.local" "$WEB_ENV"
        echo "Created apps/web/.env.local"
    else
        echo "WARNING: Template web.env.local not found in $PARENT_DIR and apps/web/.env.local does not exist"
    fi
fi
if [ -f "$WEB_ENV" ]; then
    set_env_var "$WEB_ENV" "VITE_API_URL" "$API_URL"
    if [ "${WORKTREE_ENV_VERBOSE:-0}" = "1" ]; then
        echo "Updated apps/web/.env.local"
    fi
fi

# Create root .env if missing (test user credentials, no vars to update)
ROOT_ENV="$ROOT_DIR/.env"
if [ ! -f "$ROOT_ENV" ]; then
    if [ -f "$PARENT_DIR/root.env.local" ]; then
        cp "$PARENT_DIR/root.env.local" "$ROOT_ENV"
        echo "Created .env"
    else
        echo "WARNING: Template root.env.local not found in $PARENT_DIR and .env does not exist"
    fi
fi
