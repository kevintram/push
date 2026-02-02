# AGENTS.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

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
uv sync                                 # Install dependencies
uv run fastapi dev --host localhost     # Start dev server with auto-reload
./run.sh            # Start dev server with worktree port (see ## Worktree and Environment Files)
uv run pytest                           # Run tests
uv run ruff check --fix                 # Run ruff auto-fix lint issues
uv run ruff format                      # Run ruff formatting
```
Note: When using worktrees, run `apps/api/run.sh` from the worktree to use the assigned port.

### Web App (`apps/web/`)
```bash
pnpm install        # Install dependencies
pnpm run dev        # Start dev server
./run.sh            # Start dev server with worktree port (see ## Worktree and Environment Files)
pnpm run test       # Run tests in watch mode
pnpm run lint       # Run tsc and biome lint
pnpm run validate   # Run full validation pipeline
```
Note: When using worktrees, run `apps/web/run.sh` from the worktree to use the assigned port.

### Landing page (`apps/site/`)
```bash
cd apps/site
pnpm install            # Install dependencies
pnpm run dev            # Start dev server
```

### Supabase (`supabase/`)
```bash
supabase db reset       # reconstruct and seed local db
supabase migration up   # apply new migrations to local db
supabase db push        # push new migrations to prod db
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

Each worktree gets a slot *S* (0–15) that determines its ports (API `8000 + S`, Web `5173 + S`).

- **Setup** (`worktree/add.sh`):
  1. Claims a slot in `worktree-slots.toml`
  2. Generates environment files: `.worktree.env` (via `worktree/gen-env.sh`), `.env`, `apps/api/.env`, and `apps/web/.env.local`
  3. Generates run scripts for api and web: `apps/api/run.sh` and `apps/web/run.sh`
- **Dev servers**: Run `apps/api/run.sh` or `apps/web/run.sh` to start on the assigned port (refreshes `.worktree.env` on each run).
- **Teardown**: `worktree/remove.sh` removes the worktree and frees its slot.

## E2E Validation

Please use the playwright-cli skill to perform E2E validations using your own dedicated session to prevent conflicts. 

Please authenticated with the test user account (see `.env`).

Please clean up your session when you are finished testing. 

## Development Conventions

### TODO Annotations

We use a priority-based TODO annotation system throughout the codebase:

- `TODO(0)`: Critical - never merge
- `TODO(1)`: High - architectural flaws, major bugs
- `TODO(2)`: Medium - minor bugs, missing features
- `TODO(3)`: Low - polish, tests, documentation
- `TODO(4)`: Questions/investigations needed
- `PERF`: Performance optimization opportunities

## Note:

The API is authenticated using cookies and thus cannot be hit directly. You must proceed through the browser.
