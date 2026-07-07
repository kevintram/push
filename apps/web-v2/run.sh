#!/bin/bash

set -e

APP_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
ROOT_DIR="$(cd "$APP_DIR/../.." && pwd)"
GEN_SCRIPT="$ROOT_DIR/worktree-scripts/gen-env.sh"
CONFIG_ENV="$ROOT_DIR/.worktree.env"
API_ENV="$ROOT_DIR/apps/api/.env"

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
    APP_V2_URL=$(read_var "$API_ENV" "APP_V2_URL")
    if [ -n "$APP_V2_URL" ]; then
        WEB_V2_PORT=$(echo "$APP_V2_URL" | sed -nE 's#.*:([0-9]+).*#\1#p')
    fi
fi

if [ -z "$WEB_V2_PORT" ]; then
    echo "Missing WEB_V2_PORT. Check $CONFIG_ENV or $API_ENV."
    exit 1
fi

pnpm exec vite --host localhost --port "$WEB_V2_PORT" --strictPort
