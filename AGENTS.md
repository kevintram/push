# AGENTS.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Repository Overview 

This is a monorepo containing multiple independent but related applications:

1. `apps/api/` - Python FastAPI service for all the frontend applications (deployed as `api.3gulp.com`)
2. `apps/web/` - React/TypeScript web application (deployed as `app.3gulp.com`)
3. `apps/web-v2/` - React/TypeScript Vite application
4. `apps/android/` - Kotlin native Android application **(development not started yet)**
5. `apps/ios/` -  Swift native iOS application **(development not started yet)**
6. `apps/site/` - Astro landing page (deployed as `3gulp.com`)

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
pnpm run lint       # Run tsc, eslint, formatting checks, and the React one-component rule
pnpm run validate   # Run full validation pipeline
```
Note: When using worktrees, run `apps/web/run.sh` from the worktree to use the assigned port.

### Web V2 App (`apps/web-v2/`)
```bash
pnpm install        # Install dependencies
pnpm run dev        # Start dev server
./run.sh            # Start dev server with worktree port (see ## Worktree and Environment Files)
pnpm run test       # Run tests
pnpm run lint       # Run tsc, biome lint, and component-count enforcement
pnpm run validate   # Run full validation pipeline
```
Note: When using worktrees, run `apps/web-v2/run.sh` from the worktree to use the assigned port.

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

**Format**: `<scope>[, <scope>...]: <description>`

**Scopes**: `web`, `web-v2`, `site`, `api`, `android`, `ios` (or omit for repo-wide changes)

**Examples**:
```
web: add dark mode toggle
api: handle non-existent user edge case
web, api: update user authentication flow
update root .gitignore
```
## Worktree and Environment Files

Each worktree gets a slot *S* (0–15) that determines its ports (API `8000 + S`, Web `5173 + S`, Web V2 `6173 + S`).

- **Setup** (`worktree-scripts/add.sh`):
  1. Claims a slot in `worktree-slots.toml`
  2. Generates all environment files via `worktree-scripts/gen-env.sh`: `.worktree.env`, `.env`, `apps/api/.env`, `apps/web/.env.local`, and `apps/web-v2/.env.local`
  3. Generates run scripts for api, web, and web-v2: `apps/api/run.sh`, `apps/web/run.sh`, and `apps/web-v2/run.sh`
- **Dev servers**: Run `apps/api/run.sh`, `apps/web/run.sh`, or `apps/web-v2/run.sh` to start on the assigned port (runs `gen-env.sh` to refresh env files and recreate any missing ones).
- **Teardown**: `worktree-scripts/remove.sh` removes the worktree and frees its slot.

## E2E Validation

Please use the playwright-cli skill to perform E2E validations using your own dedicated session to prevent conflicts. 

Please authenticate with the test user account using `TEST_ACCOUNT_EMAIL` and
`TEST_ACCOUNT_PASSWORD` from the root `.env`.

Please clean up your session when you are finished testing. 

## Development Conventions

### Web Component Size Rules

For `apps/web/`:
- Keep component files under 500 lines.
- Keep component files to one React component.
- Treat pages and large feature components as orchestration shells: extract JSX sections into sibling files and move non-UI logic into hooks/utilities before the file grows past the limit.

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
