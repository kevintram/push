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

## Environment files

Copy `apps/web/.env.example` to `apps/web/.env.local` and
`apps/site/.env.example` to `apps/site/.env`, then fill in the values.

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
