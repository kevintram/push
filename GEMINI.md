# GEMINI.md

This file provides guidance to Gemini when working with code in this repository.

## Repository Overview

This is a monorepo containing multiple independent but related applications:

1. `apps/api/` - Python FastAPI service for all the frontend applications
2. `apps/web/` - React/TypeScript web application
3. `apps/android/` - Kotlin native Android application **(development not started yet)**
4. `apps/ios/` -  Swift native iOS application **(development not started yet)**
5. `apps/site/` - Astro landing page

The application uses Supabase as a managed postgres database. Configuration, migration, and seed files are located in `supabase/`.

## Development Commands

### API (`apps/api/`)
```bash
uv run fastapi dev --host localhost   # Start dev server with auto-reload
uv run ruff check --fix               # Run ruff auto-fix lint issues
uv run ruff format                    # Run ruff formatting
```

### Web App (`apps/web/`)
```bash
pnpm install
pnpm run dev           # Start dev server
pnpm run test          # Run tests in watch mode
pnpm run lint          # Run tsc and biome lint
pnpm run validate      # Run full validation pipeline
```

### Landing page (`apps/site/`)
```bash
cd apps/site
pnpm install
pnpm run dev           # Start dev server
```

## Commit Guidelines

This project follows [Conventional Commits](https://www.conventionalcommits.org/):

**Format**: `<type>(<scope>): <description>`

**Types**: `feat`, `fix`, `refactor`, `style`, `docs`, `test`, `chore`

**Scopes**: `web`, `site`, `api`, `android`, `ios` (or omit for repo-wide changes)

**Examples**:
```
feat(web): add dark mode toggle
fix(api): handle non-existent user edge case
chore: update root .gitignore
```
## Worktree and Environment Files
We often use git worktrees for parallel development.

When using a worktree, environment files are stored in the parent directoy (`../`) and symlinked into every worktree (`apps/api/.env`, `apps/web/.env.local`); see `add-worktree.sh` for details.

## Development Conventions
### TODO Annotations
We use a priority-based TODO annotation system throughout the codebase:

- `TODO(0)`: Critical - never merge
- `TODO(1)`: High - architectural flaws, major bugs
- `TODO(2)`: Medium - minor bugs, missing features
- `TODO(3)`: Low - polish, tests, documentation
- `TODO(4)`: Questions/investigations needed
- `PERF`: Performance optimization opportunities
