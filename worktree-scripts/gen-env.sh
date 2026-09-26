#!/bin/bash

set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
ROOT_DIR="$(cd "$SCRIPT_DIR/.." && pwd)"
PARENT_DIR="$(cd "$ROOT_DIR/.." && pwd)"
SLOTS_FILE="$PARENT_DIR/worktree-slots.toml"
WORKTREE_ENV="$ROOT_DIR/.worktree.env"

BASE_WEB_PORT=6173
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

slot=$(python3 - "$SLOTS_FILE" "$BRANCH_NAME" "$MAX_SLOT" "$ROOT_DIR" <<'PY' || true
import os
import subprocess
import sys

slots_file = sys.argv[1]
key = sys.argv[2]
max_slot = int(sys.argv[3])
root_dir = sys.argv[4]

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

# Prune slots for worktrees that no longer exist
pruned = False
try:
    result = subprocess.run(
        ["git", "worktree", "list", "--porcelain"],
        capture_output=True, text=True, cwd=root_dir,
    )
    active_paths = {
        line.split(" ", 1)[1]
        for line in result.stdout.splitlines()
        if line.startswith("worktree ")
    }
    parent_dir = os.path.dirname(root_dir)
    stale = [
        k for k in worktrees
        if os.path.join(parent_dir, k.replace("/", "-")) not in active_paths
    ]
    for k in stale:
        del worktrees[k]
        pruned = True
except Exception:
    pass  # If pruning fails, continue without it

def write_slots():
    data["worktrees"] = worktrees
    os.makedirs(os.path.dirname(slots_file), exist_ok=True)
    with open(slots_file, "w", encoding="utf-8") as f:
        f.write("[worktrees]\n")
        for k in sorted(worktrees):
            escaped = str(k).replace("\\", "\\\\").replace('"', '\\"')
            f.write(f"\"{escaped}\" = {int(worktrees[k])}\n")

if key in worktrees:
    if pruned:
        write_slots()
    print(int(worktrees[key]))
    sys.exit(0)

used = {int(v) for v in worktrees.values()}
slot = next((i for i in range(max_slot + 1) if i not in used), None)

if slot is None:
    print("ERROR_NO_SLOT")
    sys.exit(1)

worktrees[key] = slot
write_slots()

print(int(slot))
PY
)

if [ "$slot" = "ERROR_NO_TOMLLIB" ]; then
    echo "ERROR: Python tomllib not available. Please use Python 3.11+."
    exit 1
fi

if [ "$slot" = "ERROR_NO_SLOT" ]; then
    echo "ERROR: No available port slots (0-$MAX_SLOT)."
    echo "   Free a slot or increase MAX_SLOT in worktree-scripts/gen-env.sh."
    exit 1
fi

if [ -z "$slot" ]; then
    echo "ERROR: Failed to determine worktree slot."
    exit 1
fi

WEB_PORT=$((BASE_WEB_PORT + slot))
APP_URL="http://localhost:${WEB_PORT}"

cat > "$WORKTREE_ENV" <<EOF
WORKTREE_SLOT=${slot}
WEB_PORT=${WEB_PORT}
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

# Remove KEY from a .env-style file.
remove_env_var() {
    local file="$1"
    local key="$2"
    local tmpfile
    tmpfile="$(mktemp)"
    awk -v key="$key" '$0 !~ "^"key"=" { print }' "$file" > "$tmpfile"
    mv "$tmpfile" "$file"
}

# Read KEY from a .env-style file without evaluating its contents.
get_env_var() {
    local file="$1"
    local key="$2"
    awk -v key="$key" '
        index($0, key "=") == 1 {
            sub(/^[^=]*=/, "")
            print
            exit
        }
    ' "$file"
}

# Create or update the promoted app's environment from its shared template.
WEB_ENV="$ROOT_DIR/apps/web/.env.local"
WEB_ENV_TEMPLATE="$PARENT_DIR/web.env.local"
if [ ! -f "$WEB_ENV_TEMPLATE" ] || \
    [ -z "$(get_env_var "$WEB_ENV_TEMPLATE" "VITE_CLERK_PUBLISHABLE_KEY")" ] || \
    [ -z "$(get_env_var "$WEB_ENV_TEMPLATE" "VITE_CONVEX_URL")" ]; then
    LEGACY_WEB_ENV_TEMPLATE="$PARENT_DIR/web-v2.env.local"
    if [ -f "$LEGACY_WEB_ENV_TEMPLATE" ] && \
        [ -n "$(get_env_var "$LEGACY_WEB_ENV_TEMPLATE" "VITE_CLERK_PUBLISHABLE_KEY")" ] && \
        [ -n "$(get_env_var "$LEGACY_WEB_ENV_TEMPLATE" "VITE_CONVEX_URL")" ]; then
        WEB_ENV_TEMPLATE="$LEGACY_WEB_ENV_TEMPLATE"
        echo "WARNING: Using legacy web-v2.env.local; rename it to web.env.local when convenient"
    fi
fi
if [ ! -f "$WEB_ENV" ]; then
    if [ -f "$WEB_ENV_TEMPLATE" ]; then
        cp "$WEB_ENV_TEMPLATE" "$WEB_ENV"
        echo "Created apps/web/.env.local"
    else
        touch "$WEB_ENV"
        echo "Created apps/web/.env.local (template web.env.local not found in $PARENT_DIR)"
    fi
fi
if [ -f "$WEB_ENV_TEMPLATE" ]; then
    for key in VITE_CLERK_PUBLISHABLE_KEY VITE_CONVEX_URL; do
        template_value="$(get_env_var "$WEB_ENV_TEMPLATE" "$key")"
        if [ -n "$template_value" ]; then
            set_env_var "$WEB_ENV" "$key" "$template_value"
        fi
    done
fi
remove_env_var "$WEB_ENV" "VITE_API_URL"
remove_env_var "$WEB_ENV" "VITE_SUPABASE_URL"
remove_env_var "$WEB_ENV" "VITE_SUPABASE_PUBLISHABLE_DEFAULT_KEY"
remove_env_var "$WEB_ENV" "VITE_WORKOS_CLIENT_ID"
remove_env_var "$WEB_ENV" "VITE_WORKOS_REDIRECT_URI"
remove_env_var "$WEB_ENV" "VITE_WORKOS_SIGN_OUT_RETURN_TO"

# Create or update apps/site/.env
SITE_ENV="$ROOT_DIR/apps/site/.env"
touch "$SITE_ENV"
remove_env_var "$SITE_ENV" "PUBLIC_API_URL"
set_env_var "$SITE_ENV" "PUBLIC_APP_URL" "$APP_URL"
if [ "${WORKTREE_ENV_VERBOSE:-0}" = "1" ]; then
    echo "Updated apps/site/.env"
fi

# Link root .env to the shared test-account credentials template
ROOT_ENV="$ROOT_DIR/.env"
ROOT_ENV_TEMPLATE="$PARENT_DIR/root.env.local"
ROOT_ENV_LINK="../root.env.local"
if [ ! -f "$ROOT_ENV_TEMPLATE" ]; then
    echo "WARNING: Template root.env.local not found in $PARENT_DIR"
elif [ -L "$ROOT_ENV" ]; then
    if [ "$(readlink "$ROOT_ENV")" != "$ROOT_ENV_LINK" ]; then
        echo "WARNING: $ROOT_ENV points to an unexpected target; leaving it unchanged"
    fi
elif [ -e "$ROOT_ENV" ]; then
    echo "WARNING: $ROOT_ENV exists and is not a symlink; leaving it unchanged"
else
    ln -s "$ROOT_ENV_LINK" "$ROOT_ENV"
    echo "Created .env symlink"
fi
