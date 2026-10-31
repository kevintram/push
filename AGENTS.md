# AGENTS.md

Repository guidance for AI coding agents.

## Project Architecture

This repository is Push, a React web app deployed to https://push.kevintram.com. Grow it conservatively around the existing app shell, route, style, and test patterns.

- **Frontend**: React 19 with TypeScript
- **Routing**: TanStack Router with file-based routes
- **Data Fetching**: TanStack Query
- **Styling**: StyleX, with component styles defined inline via `stylex.create()`
- **Component Primitives**: Base UI may be used for accessible primitives
- **Keyboard Shortcuts**: TanStack Hotkeys via `@tanstack/react-hotkeys`
- **Icons**: `lucide-react`
- **Build Tool**: Vite
- **Package Manager**: pnpm
- **Testing**: Vitest with Testing Library and Happy DOM
- **Linting/Formatting**: Oxlint + Oxfmt
- **Backend**: Convex

## Development Commands

Please check `package.json` for the latest scripts. Current commands:

- `pnpm dev` - Start development server with hot reload
- `pnpm build` - Build for production into `dist/`
- `pnpm preview` - Preview the production build locally
- `pnpm test` - Run unit/integration tests in watch mode
- `pnpm test:ci` - Run all tests once for CI
- `pnpm lint:tsc` - Run TypeScript compiler checks
- `pnpm lint:oxlint` - Run Oxlint checks
- `pnpm lint` - Run TypeScript, Oxlint, and formatting checks
- `pnpm format` - Format code with Oxfmt
- `pnpm validate` - Run the full local validation pipeline

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

## Keyboard Shortcuts

Use the project-local `tanstack-react-hotkeys` skill when implementing or reviewing keyboard shortcuts. Do not add application shortcuts with manual `document` or `window` keyboard listeners.

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
├── auth.config.ts         # Clerk JWT provider configuration
├── <domain>.ts            # public API — eg: `api.collections.*`
├── model/                 # all business logic, imported as namespaces
├── validators/            # resource validators, the single source of truth
└── *.test.ts              # exercise the public API, not model/ directly
```

### Mutation Patch Semantics

For optional fields in public Convex mutation patches, use a three-state API:

- An omitted field leaves the stored value unchanged.
- `null` clears the stored optional field.
- A non-null value sets or replaces the stored value.

Patch validators should express this using an optional nullable field, such as
`v.optional(v.union(valueValidator, v.null()))`.

## Testing Rules

Vitest runs two projects (see `vite.config.ts`): `frontend` for `src/` under Happy DOM, and `convex` for `convex/` under `edge-runtime`. `pnpm test` and `pnpm test:ci` run both.

- Place frontend tests in `__tests__/` folders next to the code under test.
- Route-level and app integration tests belong under `src/app/__tests__/`, not under `src/app/routes/`.
- Convex function tests are the exception to the `__tests__/` rule: colocate them flat beside the function file as `convex/<name>.test.ts`, following the `convex-test` convention. They import the module map from `convex/test.setup.ts`.
- Both `convex/*.test.ts` and `convex/test.setup.ts` are kept out of deploys by the Convex bundler's rule that skips filenames containing more than one dot. Preserve that shape when adding files under `convex/` that must not ship.
- Use Testing Library for behavior-focused assertions.
- Prefer the smallest useful test scope: pure utilities first, component tests for UI behavior, route integration tests for routing/provider behavior.
- There is no Playwright setup yet. If E2E coverage is added, follow the root repository guidance for browser authentication and session cleanup.

## Backend and Auth Notes

The app uses Convex for its backend and Clerk for authentication. Validate
authenticated user flows through the browser.

Local web app configuration uses `VITE_CLERK_PUBLISHABLE_KEY` and
`VITE_CONVEX_URL` in `.env.local`; copy `.env.example` to start.

All checkouts share one Convex dev deployment, so `npx convex dev` pushes from
parallel worktrees overwrite each other. Run it from one worktree at a time.

## Date Conventions

- In `src/`, a `DateString` is a calendar date in the user's current local timezone. Use `todayIso()` for the current day and `parseDate()` for local-midnight parsing.
- In `shared/srs/` and `convex/model/srs/`, date strings are opaque day indexes. Parse them at UTC midnight so replay and elapsed-day calculations do not depend on the process timezone.
- `date` and `dueDate` are date-only values (`YYYY-MM-DD`). Clients submit the local completion date only when re-rating an already-completed review; a first completion with no date falls back to the review's scheduled day.

## Generated Files

- Do not manually edit `src/app/routeTree.gen.ts`; TanStack Router generates it.
- Do not commit or depend on generated `coverage/`, `dist/`, or `node_modules/` content.

## Commit Guidelines

Use `<scope>: <description>`. Use the `web` scope for app changes; omit the
scope for repository-wide changes.

## TODO Annotations

- `TODO(0)`: Critical; never merge.
- `TODO(1)`: High; architectural flaws or major bugs.
- `TODO(2)`: Medium; minor bugs or missing features.
- `TODO(3)`: Low; polish or tests/documentation.
- `TODO(4)`: Questions or investigations needed.
- `PERF`: Performance optimization opportunities.

<!-- convex-ai-start -->

This project uses [Convex](https://convex.dev) as its backend.

When working on Convex code, **always read
`convex/_generated/ai/guidelines.md` first** for important guidelines on
how to correctly use Convex APIs and patterns. The file contains rules that
override what you may have learned about Convex from training data.

Convex agent skills for common tasks can be installed by running
`npx convex ai-files install`.

<!-- convex-ai-end -->
