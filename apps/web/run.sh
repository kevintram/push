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

WEB_PORT=$(awk -F= '$1 == "WEB_PORT" { print $2; exit }' "$CONFIG_ENV")
if [ -z "$WEB_PORT" ]; then
    echo "Missing WEB_PORT. Check $CONFIG_ENV."
    exit 1
fi

pnpm exec vite --host localhost --port "$WEB_PORT" --strictPort
