# AGENTS.md

This file provides guidance to Claude Code (claude.ai/code) when working with the WebV2 application.

## Project Architecture

This is the second-generation React web app for 3gulp. It is intentionally small right now and should grow conservatively around the existing app shell, route, style, and test patterns.

- **Frontend**: React 19 with TypeScript
- **Routing**: TanStack Router with file-based routes
- **Data Fetching**: TanStack Query
- **Styling**: StyleX, with component styles defined inline via `stylex.create()`
- **Component Primitives**: Base UI may be used for accessible primitives
- **Icons**: `lucide-react`
- **Build Tool**: Vite
- **Package Manager**: pnpm
- **Testing**: Vitest with Testing Library and Happy DOM
- **Linting/Formatting**: Oxlint + Oxfmt
- **Backend**: FastAPI via `VITE_API_URL`

## Development Commands

Please check `package.json` for the latest scripts. Current commands:

- `pnpm dev` - Start development server with hot reload
- `./run.sh` - Worktree dev server on the assigned WebV2 port
- `pnpm build` - Build for production into `dist/`
- `pnpm preview` - Preview the production build locally
- `pnpm test` - Run unit/integration tests in watch mode
- `pnpm test:ci` - Run all tests once for CI
- `pnpm lint:tsc` - Run TypeScript compiler checks
- `pnpm lint:oxlint` - Run Oxlint checks
- `pnpm lint` - Run TypeScript, Oxlint, and formatting checks
- `pnpm format` - Format code with Oxfmt
- `pnpm validate` - Run the full local validation pipeline

Worktrees: use `apps/web-v2/run.sh` from the worktree. It runs `worktree-scripts/gen-env.sh` to refresh env files, then starts Vite on `WEB_V2_PORT` (`6173 + slot`).

## Component Size Limits

Keep `src/**/*.tsx` files under **500 lines** and to **one React component**. Oxlint enforces the component rule for normal source files.

When a file approaches either limit, split it:

- Extract presentational sections into sibling `.tsx` files.
- Move derived state, mutations, and orchestration into colocated `.ts` hooks or utilities.
- Keep route files thin and delegate page rendering to `src/app/pages/`.

## StyleX Conventions

- Use `stylex.create()` for component styles and `stylex.props()` to apply them.
- Define component styles inline in the component file (a `styles` const above the component), not in a separate per-component style module.
- Reserve `*.stylex.ts` files for shared tokens imported by components. Keep app-wide theme tokens in `src/styles/*.stylex.ts`.
- Use `defineVars()` for themeable values and `defineConsts()` for static shared values such as media queries.
- Use longhand CSS properties and single-value shorthands rather than multi-value shorthands.
- For conditional values, include a `default` branch.
- Do not mix `className`, inline `style`, and `stylex.props()` unless an existing compatibility pattern already requires it.
- Keep global CSS minimal. `src/styles/global.css` should be reserved for StyleX setup, document resets, font smoothing, and true global element rules.

## Project Structure

```text
src/
├── app/                     # Routing, page orchestration, app providers
│   ├── routes/              # TanStack Router file-based routes
│   ├── pages/               # Page components
│   └── __tests__/           # App and route integration tests
├── components/              # Cross-domain shared components
│   └── ui/                  # Shared primitive UI components
├── modules/                 # Product/domain modules
├── hooks/                   # App-wide shared hooks
├── lib/                     # Preconfigured library wrappers
├── models/                  # Shared data models
├── stores/                  # Global state providers
├── styles/                  # Global CSS and StyleX theme tokens
├── testing/                 # Shared test infrastructure
└── utils/                   # Shared utility functions
```

## Placement Rules

**Routes**: Keep `src/app/routes/` files route-only. TanStack Router treats files in this folder as route modules, so do not place tests, helpers, or components there.

**Pages**: Put page components in `src/app/pages/`. If a page grows, convert it to a folder with the page shell, sibling section components, styles, hooks, and utilities.

**Components**: Colocate components with the page or module that owns them. Only promote to `src/components/` when genuinely reused across unrelated domains. Reserve `src/components/ui/` for shared primitive components.

**Modules**: Product areas live in `src/modules/<module>/` 

Module shape:

```text
src/modules/<module>/
├── api/          # TanStack Query hooks and API request functions
├── components/   # Components scoped to this module
├── hooks/        # Hooks scoped to this module
├── types/        # Domain types
└── utils/        # Module-local utilities
```

## Convex Backend Structure

`convex/` follows the layering Convex recommends: the public API is a set of thin
wrappers, and the logic lives in `convex/model/`.

```text
convex/
├── schema.ts              # defineSchema: tables and indexes only
├── auth.config.ts         # WorkOS custom JWT providers
├── <domain>.ts            # public API — eg: `api.topics.*`
├── model/                 # all business logic, imported as namespaces
├── validators/            # resource validators, the single source of truth
└── *.test.ts              # exercise the public API, not model/ directly
```

## Testing Rules

Vitest runs two projects (see `vite.config.ts`): `frontend` for `src/` under Happy DOM, and `convex` for `convex/` under `edge-runtime`. `pnpm test` and `pnpm test:ci` run both.

- Place frontend tests in `__tests__/` folders next to the code under test.
- Route-level and app integration tests belong under `src/app/__tests__/`, not under `src/app/routes/`.
- Convex function tests are the exception to the `__tests__/` rule: colocate them flat beside the function file as `convex/<name>.test.ts`, following the `convex-test` convention. They import the module map from `convex/test.setup.ts`.
- Both `convex/*.test.ts` and `convex/test.setup.ts` are kept out of deploys by the Convex bundler's rule that skips filenames containing more than one dot. Preserve that shape when adding files under `convex/` that must not ship.
- Use Testing Library for behavior-focused assertions.
- Prefer the smallest useful test scope: pure utilities first, component tests for UI behavior, route integration tests for routing/provider behavior.
- There is no WebV2 Playwright setup yet. If E2E coverage is added, follow the root repository guidance for browser authentication and session cleanup.

## API and Auth Notes

The API is cookie-authenticated and generally cannot be tested by hitting API endpoints directly. User-facing flows should be validated through the browser when auth is involved.

Local WebV2 uses `VITE_API_URL` from `apps/web-v2/.env.local`, refreshed by `worktree-scripts/gen-env.sh`. If WebV2 API requests fail locally with CORS or cookie issues, check the worktree-generated API origin settings before changing frontend request code.

## Generated Files

- Do not manually edit `src/app/routeTree.gen.ts`; TanStack Router generates it.
- Do not commit or depend on generated `coverage/`, `dist/`, or `node_modules/` content.

<!-- convex-ai-start -->

This project uses [Convex](https://convex.dev) as its backend.

When working on Convex code, **always read
`convex/_generated/ai/guidelines.md` first** for important guidelines on
how to correctly use Convex APIs and patterns. The file contains rules that
override what you may have learned about Convex from training data.

Convex agent skills for common tasks can be installed by running
`npx convex ai-files install`.

<!-- convex-ai-end -->
