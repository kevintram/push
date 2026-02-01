#!/bin/bash

# Script to remove a git worktree and its /etc/hosts entry
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

sanitize_hostname() {
    echo "$1" | tr '[:upper:]' '[:lower:]' | sed -E 's/[^a-z0-9]+/-/g; s/^-+//; s/-+$//'
}

remove_hosts_entry() {
    local api_host="$1"
    local web_host="$2"
    local hosts_file="/etc/hosts"
    local tmpfile

    if [ ! -f "$hosts_file" ]; then
        return
    fi

    if ! grep -qE "[[:space:]](${api_host}|${web_host})([[:space:]]|$)" "$hosts_file"; then
        echo "ℹ️  /etc/hosts has no entry for ${api_host} or ${web_host}"
        return
    fi

    echo "🧹 Removing /etc/hosts entry..."
    tmpfile="$(mktemp)"
    if [ -w "$hosts_file" ]; then
        grep -vE "[[:space:]](${api_host}|${web_host})([[:space:]]|$)" "$hosts_file" > "$tmpfile"
        mv "$tmpfile" "$hosts_file"
    else
        sudo sh -c "grep -vE '[[:space:]](${api_host}|${web_host})([[:space:]]|$)' \"$hosts_file\" > \"$tmpfile\" && mv \"$tmpfile\" \"$hosts_file\""
    fi
}

DIR_NAME="${BRANCH_NAME//\//-}"
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PARENT_DIR="$(dirname "$SCRIPT_DIR")"
TARGET_WORKTREE="$PARENT_DIR/$DIR_NAME"

if [ "$TARGET_WORKTREE" = "$SCRIPT_DIR" ]; then
    echo "❌ Refusing to remove the current worktree. Run this from another worktree."
    exit 1
fi

if [ ! -d "$TARGET_WORKTREE" ]; then
    echo "❌ Worktree not found: $TARGET_WORKTREE"
    exit 1
fi

SAFE_NAME="$(sanitize_hostname "$DIR_NAME")"
if [ -z "$SAFE_NAME" ]; then
    SAFE_NAME="worktree"
fi

API_HOST="api-${SAFE_NAME}.local"
WEB_HOST="web-${SAFE_NAME}.local"

remove_hosts_entry "$API_HOST" "$WEB_HOST"

if [ "$FORCE" = true ]; then
    echo "🗑️  Removing worktree (force): $TARGET_WORKTREE"
    git worktree remove -f "$TARGET_WORKTREE"
else
    echo "🗑️  Removing worktree: $TARGET_WORKTREE"
    git worktree remove "$TARGET_WORKTREE"
fi

echo "✅ Removed worktree: $BRANCH_NAME"
