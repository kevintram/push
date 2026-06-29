# AGENTS.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Architecture

This is a React application built with modern tooling focused on topic-based learning and practice.
- **Frontend**: React 19 with TypeScript
- **Routing**: TanStack Router (file-based routing with type safety)
- **Styling**: Tailwind CSS v4
- **Component Library**: shadcn/ui w/ Base UI components (see https://ui.shadcn.com/docs/changelog/2026-01-base-ui)
- **Data Fetching**: TanStack Query with React Query
- **Backend**: FastAPI (Python) for data access and business logic
- **Date Handling**: Day.js for all date parsing, formatting, and manipulation
- **Build Tool**: Vite 6
- **Package Manager**: pnpm
- **Testing**: Vitest (unit/integration), Playwright (E2E)
- **Linting/Formatting**: Oxlint + Oxfmt
- **Mocking**: MSW (Mock Service Worker)

## Development Commands
- Please see the package.json file for all the latest command scripts.

For your convenience, these are the commands as of writing this:
- `pnpm dev` - Start development server with hot reload
- `./run.sh` - Worktree dev server (assigned port)
- `pnpm build` - Build for production (output to `dist/`)
- `pnpm preview` - Preview production build locally
- `pnpm test` - Run unit/integration tests in watch mode
- `pnpm test:ci` - Run all tests once (for CI)
- `pnpm test:e2e` - Run E2E tests with Playwright UI
- `pnpm test:e2e:ci` - Run E2E tests headlessly
- `pnpm lint:tsc` - Run TypeScript compiler checks
- `pnpm lint:oxlint` - Run Oxlint checks
- `pnpm lint` - Run all linting (TypeScript + Oxlint + formatting checks)
- `pnpm format` - Format code with Oxfmt
- `pnpm validate` - Run full validation pipeline (lint + test:ci + test:e2e:ci)

Worktrees: use `apps/web/run.sh` from the worktree. It runs `worktree-scripts/gen-env.sh` to refresh all env files (and recreate any missing ones) then starts on the assigned port.

## Component Size Limits

Keep `src/**/*.tsx` files under **500 lines** and to **one React component**. Oxlint enforces the component limit. (`src/components/ui/` and test files are excluded from the automated component check, but the same discipline applies.)

When a file approaches either limit, split it: extract presentational sections into sibling `.tsx` files, and move orchestration, derived state, and mutations into a colocated `.ts` hook.

## Button Icon Sizing

Button icons inherit their size automatically from the button's `size` variant — do not pass manual sizing classes (`h-4 w-4`, `size-4`, etc.) to SVGs inside buttons. Just use `<Plus />`, not `<Plus className='h-4 w-4' />`. Icons that need to opt out of inherited sizing (e.g. for color-only overrides) can use an explicit `size-*` or `h-*`/`w-*` class to escape the automatic selector.

## Project Structure

```
src/
├── app/                     # Application routing and page orchestration
│   ├── routes/              # TanStack Router file-based routes (no test files here)
│   ├── pages/               # Page components; complex pages get their own folder
│   │   ├── topic-detail/    # e.g. TopicDetailPage.tsx + sibling sections + hooks
│   │   └── review-card-detail/
│   ├── layouts/             # Layout wrappers (PageLayout, etc.)
│   ├── components/          # App-level components not owned by a module
│   ├── hooks/               # App-level hooks
│   └── __tests__/routes/    # Route-level integration tests
│
├── components/              # Shared cross-domain components
│   └── ui/                  # shadcn/ui design-system primitives
│
├── modules/                 # Product and domain modules
│   ├── shell/               # App chrome (AppShell, AppHeader, AppSidebar)
│   ├── review-cards/
│   ├── reviews/
│   ├── search/
│   └── topics/
│
├── hooks/                   # App-wide shared hooks
├── lib/                     # Preconfigured library wrappers
├── models/                  # Shared data models
├── stores/                  # Global state (React context providers)
├── testing/                 # Shared test infrastructure
│   ├── msw/                 # MSW handlers and mock data fixtures
│   └── support/             # Test utilities and render helpers
└── utils/                   # Shared utility functions

e2e/
└── tests/                   # Playwright E2E specs
```

### Placement Rules

**Components**: Colocate with the page or module that owns them. Only promote to `src/components/` when genuinely used across multiple unrelated domains. `src/components/ui/` is reserved for design-system primitives (shadcn/ui).

**Tests**: Place in a `__tests__/` folder next to the code under test. **Exception**: route-level integration tests belong in `src/app/__tests__/routes/` — never inside `src/app/routes/`, because TanStack Router treats every file there as a route module.

**Shared test infrastructure** (MSW handlers, mock data, render helpers): `src/testing/`.

**Complex pages**: When a page grows, convert it to a folder — `pages/page-name/PageName.tsx` as the orchestration shell, sibling `.tsx` files for sections, and `.ts` files for hooks and utilities.

### Module Structure

Each module is a self-contained product or domain area:

```
src/modules/<module>/
├── api/          # TanStack Query hooks and API request functions
├── components/   # Components scoped to this module
├── hooks/        # Hooks scoped to this module
├── types/        # TypeScript types for this module's domain
├── utils/        # Utility functions for this module
└── index.ts      # Public API — the only sanctioned import surface for code outside this module
```

Import modules through their `index.ts` when a module exposes one. Do not reach into a module's internals from outside its folder unless the module intentionally has no public barrel yet.
