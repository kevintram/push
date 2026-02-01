#!/bin/bash

# Script to remove a git worktree
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

if [ "$FORCE" = true ]; then
    echo "🗑️  Removing worktree (force): $TARGET_WORKTREE"
    git worktree remove -f "$TARGET_WORKTREE"
else
    echo "🗑️  Removing worktree: $TARGET_WORKTREE"
    git worktree remove "$TARGET_WORKTREE"
fi

echo "✅ Removed worktree: $BRANCH_NAME"
