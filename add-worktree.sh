#!/bin/bash

# Script to create a new git worktree from current branch for the monorepo
# Usage: ./add-worktree.sh <branch-name>

set -e

if [ $# -eq 0 ]; then
    echo "Usage: $0 <branch-name>"
    echo "Example: $0 feature/new-feature"
    exit 1
fi

BRANCH_NAME="$1"
# Create directory name by replacing slashes with dashes
DIR_NAME="${BRANCH_NAME//\//-}"
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PARENT_DIR="$(dirname "$SCRIPT_DIR")"
CURRENT_WORKTREE="$SCRIPT_DIR"
NEW_WORKTREE="$PARENT_DIR/$DIR_NAME"

# Get the current branch name
CURRENT_BRANCH=$(git branch --show-current)

echo "🔄 Updating $CURRENT_BRANCH branch..."
cd "$CURRENT_WORKTREE"
git fetch origin
git pull origin "$CURRENT_BRANCH"

echo "🌱 Creating new worktree for branch: $BRANCH_NAME (from $CURRENT_BRANCH)"

# Check if branch already exists
if git show-ref --verify --quiet refs/heads/"$BRANCH_NAME"; then
    echo "⚠️  Branch '$BRANCH_NAME' already exists!"
    echo ""
    echo "What would you like to do?"
    echo "1) Delete the existing branch and create a new one"
    echo "2) Create a worktree from the existing branch"
    echo "3) Cancel and choose a different branch name"
    echo ""
    read -p "Choose an option (1/2/3): " choice

    case $choice in
        1)
            echo "🗑️  Deleting existing branch '$BRANCH_NAME'..."
            git branch -D "$BRANCH_NAME"
            git worktree add "$NEW_WORKTREE" -b "$BRANCH_NAME" "$CURRENT_BRANCH"
            ;;
        2)
            echo "🔄 Creating worktree from existing branch '$BRANCH_NAME'..."
            git worktree add "$NEW_WORKTREE" "$BRANCH_NAME"
            ;;
        3)
            echo "❌ Cancelled. Please run the script again with a different branch name."
            exit 0
            ;;
        *)
            echo "❌ Invalid option. Exiting."
            exit 1
            ;;
    esac
else
    git worktree add "$NEW_WORKTREE" -b "$BRANCH_NAME" "$CURRENT_BRANCH"
fi

echo "🔗 Creating symlinks to env files..."
cd "$NEW_WORKTREE"

# Symlink web env
if [ -f "$PARENT_DIR/web.env.local" ]; then
    ln -sf "$PARENT_DIR/web.env.local" "$NEW_WORKTREE/apps/web/.env.local"
    echo "✅ Linked web.env.local"
else
    echo "⚠️  web.env.local not found in parent directory"
fi

# Symlink api env
if [ -f "$PARENT_DIR/api.env.local" ]; then
    ln -sf "$PARENT_DIR/api.env.local" "$NEW_WORKTREE/apps/api/.env"
    echo "✅ Linked api.env.local"
else
    echo "⚠️  api.env.local not found in parent directory"
fi

echo "📦 Installing dependencies..."

# Install web dependencies
if [ -d "$NEW_WORKTREE/apps/web" ]; then
    echo "  📦 Installing web dependencies (pnpm)..."
    cd "$NEW_WORKTREE/apps/web"
    pnpm install
fi

# Install site dependencies
if [ -d "$NEW_WORKTREE/apps/site" ]; then
    echo "  📦 Installing site dependencies (pnpm)..."
    cd "$NEW_WORKTREE/apps/site"
    pnpm install
fi

# Install api dependencies
if [ -d "$NEW_WORKTREE/apps/api" ]; then
    echo "  📦 Installing api dependencies (uv)..."
    cd "$NEW_WORKTREE/apps/api"
    uv sync
fi

echo "🚀 Setting up upstream branch..."
cd "$NEW_WORKTREE"
git push --set-upstream origin "$BRANCH_NAME"

echo "🎉 Worktree '$BRANCH_NAME' created successfully!"
echo "📍 Location: $NEW_WORKTREE"
echo "cd $NEW_WORKTREE" | pbcopy
echo "📋 Copied to clipboard: cd $NEW_WORKTREE"
