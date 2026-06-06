#!/bin/bash

set -e

APP_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
ROOT_DIR="$(cd "$APP_DIR/../.." && pwd)"
GEN_SCRIPT="$ROOT_DIR/worktree-scripts/gen-env.sh"
CONFIG_ENV="$ROOT_DIR/.worktree.env"

if [ ! -f "$GEN_SCRIPT" ]; then
    echo "Missing generator script: $GEN_SCRIPT."
    exit 1
fi

bash "$GEN_SCRIPT"

read_var() {
    local file="$1"
    local key="$2"
    if [ ! -f "$file" ]; then
        return 1
    fi
    grep -E "^${key}=" "$file" | head -1 | cut -d= -f2- | tr -d '"'
}

WEB_V2_PORT=$(read_var "$CONFIG_ENV" "WEB_V2_PORT")

if [ -z "$WEB_V2_PORT" ]; then
    echo "Missing WEB_V2_PORT. Check $CONFIG_ENV."
    exit 1
fi

pnpm exec vite --host localhost --port "$WEB_V2_PORT" --strictPort
