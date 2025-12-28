#!/bin/bash

# Script to create a new git worktree from current branch for the monorepo
# Usage: ./add-worktree.sh [-e|--existing] <branch-name>

set -e

# Parse arguments
USE_EXISTING=false
BRANCH_NAME=""

while [[ $# -gt 0 ]]; do
    case $1 in
        -e|--existing)
            USE_EXISTING=true
            shift
            ;;
        -h|--help)
            echo "Usage: $0 [-e|--existing] <branch-name>"
            echo ""
            echo "Options:"
            echo "  -e, --existing  Use an existing branch (local or remote)"
            echo "  -h, --help      Show this help message"
            echo ""
            echo "Examples:"
            echo "  $0 feature/new-feature        # Create a new branch"
            echo "  $0 -e feature/existing        # Use an existing branch"
            exit 0
            ;;
        -*)
            echo "❌ Unknown option: $1"
            echo "Use -h or --help for usage information."
            exit 1
            ;;
        *)
            BRANCH_NAME="$1"
            shift
            ;;
    esac
done

if [ -z "$BRANCH_NAME" ]; then
    echo "Usage: $0 [-e|--existing] <branch-name>"
    echo "Example: $0 feature/new-feature"
    echo "Use -h or --help for more information."
    exit 1
fi

# Helper function to check if local branch exists
branch_exists_locally() {
    git show-ref --verify --quiet refs/heads/"$1" 2>/dev/null
}

# Helper function to check if remote branch exists
branch_exists_remotely() {
    git show-ref --verify --quiet refs/remotes/origin/"$1" 2>/dev/null
}

# Helper function to check if branches have diverged
check_divergence() {
    local branch="$1"
    local local_sha=$(git rev-parse refs/heads/"$branch" 2>/dev/null)
    local remote_sha=$(git rev-parse refs/remotes/origin/"$branch" 2>/dev/null)

    if [ "$local_sha" = "$remote_sha" ]; then
        echo "in_sync"
    elif git merge-base --is-ancestor "$local_sha" "$remote_sha" 2>/dev/null; then
        echo "remote_ahead"
    elif git merge-base --is-ancestor "$remote_sha" "$local_sha" 2>/dev/null; then
        echo "local_ahead"
    else
        echo "diverged"
    fi
}
# Create directory name by replacing slashes with dashes
DIR_NAME="${BRANCH_NAME//\//-}"
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PARENT_DIR="$(dirname "$SCRIPT_DIR")"
CURRENT_WORKTREE="$SCRIPT_DIR"
NEW_WORKTREE="$PARENT_DIR/$DIR_NAME"

# Get the current branch name
CURRENT_BRANCH=$(git branch --show-current)

# Fetch to ensure we have latest remote info
echo "🔄 Fetching latest from origin..."
cd "$CURRENT_WORKTREE"
git fetch origin

# Check branch existence (after fetch so remote info is accurate)
LOCAL_EXISTS=false
REMOTE_EXISTS=false

if branch_exists_locally "$BRANCH_NAME"; then
    LOCAL_EXISTS=true
fi

if branch_exists_remotely "$BRANCH_NAME"; then
    REMOTE_EXISTS=true
fi

if [ "$USE_EXISTING" = true ]; then
    # EXISTING MODE: Use an existing branch
    echo "🔄 Using existing branch: $BRANCH_NAME"

    if [ "$LOCAL_EXISTS" = false ] && [ "$REMOTE_EXISTS" = false ]; then
        echo "❌ Branch '$BRANCH_NAME' does not exist locally or on remote."
        echo "   To create a new branch, run without -e flag:"
        echo "   $0 $BRANCH_NAME"
        exit 1
    fi

    if [ "$LOCAL_EXISTS" = true ] && [ "$REMOTE_EXISTS" = true ]; then
        # Both exist - check for divergence
        divergence=$(check_divergence "$BRANCH_NAME")
        case $divergence in
            in_sync)
                echo "✅ Local and remote are in sync"
                git worktree add "$NEW_WORKTREE" "$BRANCH_NAME"
                ;;
            local_ahead)
                echo "ℹ️  Local branch has unpushed commits"
                git worktree add "$NEW_WORKTREE" "$BRANCH_NAME"
                ;;
            remote_ahead)
                echo "ℹ️  Remote has new commits, will pull after creating worktree"
                git worktree add "$NEW_WORKTREE" "$BRANCH_NAME"
                cd "$NEW_WORKTREE"
                git pull origin "$BRANCH_NAME"
                ;;
            diverged)
                echo "⚠️  Local and remote branches have diverged!"
                echo "   Local:  $(git rev-parse --short refs/heads/"$BRANCH_NAME")"
                echo "   Remote: $(git rev-parse --short refs/remotes/origin/"$BRANCH_NAME")"
                echo ""
                echo "What would you like to do?"
                echo "1) Use local branch as-is"
                echo "2) Reset local to match remote"
                echo "3) Cancel"
                echo ""
                read -p "Choose an option (1/2/3): " choice

                case $choice in
                    1)
                        echo "🔄 Using local branch as-is..."
                        git worktree add "$NEW_WORKTREE" "$BRANCH_NAME"
                        ;;
                    2)
                        echo "🔄 Resetting local branch to match remote..."
                        git branch -f "$BRANCH_NAME" "origin/$BRANCH_NAME"
                        git worktree add "$NEW_WORKTREE" "$BRANCH_NAME"
                        ;;
                    3)
                        echo "❌ Cancelled."
                        exit 0
                        ;;
                    *)
                        echo "❌ Invalid option. Exiting."
                        exit 1
                        ;;
                esac
                ;;
        esac
    elif [ "$LOCAL_EXISTS" = true ]; then
        # Local only
        echo "ℹ️  Branch exists locally only"
        git worktree add "$NEW_WORKTREE" "$BRANCH_NAME"
    else
        # Remote only - create local tracking branch
        git worktree add "$NEW_WORKTREE" -b "$BRANCH_NAME" "origin/$BRANCH_NAME"
    fi
else
    # CREATE MODE: Create a new branch
    echo "🌱 Creating new worktree for branch: $BRANCH_NAME (from $CURRENT_BRANCH)"

    # Only pull if current branch has a remote tracking branch
    if git rev-parse --verify --quiet "refs/remotes/origin/$CURRENT_BRANCH" >/dev/null 2>&1; then
        echo "🔄 Updating $CURRENT_BRANCH branch..."
        git pull origin "$CURRENT_BRANCH"
    else
        echo "ℹ️  Current branch '$CURRENT_BRANCH' has no remote tracking branch, skipping pull"
    fi

    if [ "$LOCAL_EXISTS" = true ] || [ "$REMOTE_EXISTS" = true ]; then
        # Branch exists somewhere
        if [ "$LOCAL_EXISTS" = true ] && [ "$REMOTE_EXISTS" = true ]; then
            echo "⚠️  Branch '$BRANCH_NAME' already exists locally and on remote!"
        elif [ "$LOCAL_EXISTS" = true ]; then
            echo "⚠️  Branch '$BRANCH_NAME' already exists locally!"
        else
            echo "⚠️  Branch '$BRANCH_NAME' already exists on remote!"
        fi
        echo ""
        echo "What would you like to do?"
        echo "1) Delete existing and create fresh from $CURRENT_BRANCH"
        echo "2) Use the existing branch instead"
        echo "3) Cancel"
        echo ""
        read -p "Choose an option (1/2/3): " choice

        case $choice in
            1)
                echo "🗑️  Deleting existing branch '$BRANCH_NAME'..."
                if [ "$LOCAL_EXISTS" = true ]; then
                    git branch -D "$BRANCH_NAME"
                fi
                if [ "$REMOTE_EXISTS" = true ]; then
                    echo "🗑️  Deleting remote branch..."
                    git push origin --delete "$BRANCH_NAME" 2>/dev/null || true
                    REMOTE_EXISTS=false
                fi
                git worktree add "$NEW_WORKTREE" -b "$BRANCH_NAME" "$CURRENT_BRANCH"
                ;;
            2)
                echo "🔄 Switching to existing mode..."
                if [ "$LOCAL_EXISTS" = true ]; then
                    git worktree add "$NEW_WORKTREE" "$BRANCH_NAME"
                else
                    # Remote only - create local tracking branch
                    git worktree add "$NEW_WORKTREE" -b "$BRANCH_NAME" "origin/$BRANCH_NAME"
                fi
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
        # Branch doesn't exist - create it
        git worktree add "$NEW_WORKTREE" -b "$BRANCH_NAME" "$CURRENT_BRANCH"
    fi
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
if [ "$REMOTE_EXISTS" = true ] || branch_exists_remotely "$BRANCH_NAME"; then
    # Remote already exists, just set tracking
    git branch --set-upstream-to=origin/"$BRANCH_NAME" "$BRANCH_NAME"
else
    # Push and set upstream
    git push --set-upstream origin "$BRANCH_NAME"
fi

echo "🎉 Worktree '$BRANCH_NAME' created successfully!"
echo "📍 Location: $NEW_WORKTREE"
echo "cd $NEW_WORKTREE" | pbcopy
echo "📋 Copied to clipboard: cd $NEW_WORKTREE"
