# AGENTS.md

Repository guidance for AI coding agents.

## Repository overview

This monorepo contains the active React application at `apps/web/` and the Astro
marketing site at `apps/site/`. `apps/android/` and `apps/ios/` are present but
their development has not started. The web app uses Clerk for authentication
and Convex for its backend.

## Development commands

### Web app (`apps/web/`)

```bash
pnpm install
pnpm run dev
./run.sh            # Worktree-aware dev server
pnpm test            # Unit/integration tests in watch mode
pnpm test:ci         # Run tests once
pnpm run lint        # TypeScript, Oxlint, and formatting checks
pnpm run build
pnpm run validate
```

### Marketing site (`apps/site/`)

```bash
cd apps/site
pnpm install
pnpm run dev
pnpm run build
```

## Commit guidelines

Use `<scope>: <description>`. Scopes include `web`, `site`, `android`, and
`ios`; omit the scope for repository-wide changes.

## Worktree and environment files

Each worktree gets a slot *S* (0–15); the web app uses port `6173 + S`.

- `worktree-scripts/add.sh` creates the worktree, environment, `apps/web/run.sh`,
  and installs dependencies.
- `worktree-scripts/gen-env.sh` maintains `.worktree.env`,
  `apps/web/.env.local`, and `apps/site/.env`. It reads
  `VITE_CLERK_PUBLISHABLE_KEY` and `VITE_CONVEX_URL` from the shared
  `web.env.local` template beside the repository.
- `apps/web/run.sh` refreshes generated values and starts Vite on the assigned
  worktree port.
- `worktree-scripts/remove.sh` removes a worktree and frees its slot.

The site uses `PUBLIC_APP_URL` for the login redirect. Set this to the app's
deployed URL in the hosting environment.

## Web component size rules

For `apps/web/`:

- Keep component files under 500 lines.
- Keep component files to one React component.
- Keep pages and large feature components as orchestration shells; extract JSX
  sections into sibling files and move non-UI logic into hooks/utilities before
  files grow past the limit.

## TODO annotations

- `TODO(0)`: Critical; never merge.
- `TODO(1)`: High; architectural flaws or major bugs.
- `TODO(2)`: Medium; minor bugs or missing features.
- `TODO(3)`: Low; polish or tests/documentation.
- `TODO(4)`: Questions or investigations needed.
- `PERF`: Performance optimization opportunities.
