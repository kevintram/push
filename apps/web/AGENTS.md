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
- **Linting/Formatting**: Biome V2
- **Mocking**: MSW (Mock Service Worker)

## Development Commands
- Please see the package.json file for all the latest command scripts.

For for your convience, these are the commands of writing this:
- `pnpm dev` - Start development server with hot reload
- `./run.sh` - Worktree dev server (assigned port)
- `pnpm build` - Build for production (output to `dist/`)
- `pnpm preview` - Preview production build locally
- `pnpm test` - Run unit/integration tests in watch mode
- `pnpm test:ci` - Run all tests once (for CI)
- `pnpm test:e2e` - Run E2E tests with Playwright UI
- `pnpm test:e2e:ci` - Run E2E tests headlessly
- `pnpm lint:tsc` - Run TypeScript compiler checks
- `pnpm lint:biome` - Run Biome linting and formatting
- `pnpm lint:component-count` - Enforce max two React components per file
- `pnpm lint` - Run all linting (TypeScript + Biome + component-count)
- `pnpm format` - Format code with Biome
- `pnpm validate` - Run full validation pipeline (lint + test:ci + test:e2e:ci)

Worktrees: use `apps/web/run.sh` from the worktree. It runs `worktree/gen-env.sh` to refresh all env files (and recreate any missing ones) then starts on the assigned port.

## File Size And Component Count Rules

For `src/**/*.tsx`:
- Keep component files under 500 lines.
- Keep component files to at most 2 React components.
- When a file starts to approach either limit, split presentational sections into sibling `.tsx` files and move orchestration, derived state, and mutations into colocated `.ts` hooks/utilities.
- `src/components/ui/**` and test files are excluded from the 500-line Biome check, but new feature/page code should still follow the same discipline unless there is a strong reason not to.

## Project Structure

The application generally follows [bulletproof react](https://github.com/alan2207/bulletproof-react/blob/master/docs/project-structure.md) project structure, however it has been modified to accommodate [TanStack Router](https://tanstack.com/router/latest/docs/framework/react/overview).

### Boundary Rules

- `src/components/ui/**` is for reusable design-system primitives.
- `src/components/**` is for genuinely shared cross-domain components only.
- If a helper is only used by one page or one feature cluster, colocate it with that page or feature instead of keeping it in `src/components`.
- Keep `src/app/pages/**` root mostly to simple route-facing pages. Complex pages should live in page folders with local sections/hooks such as `page-name/PageName.tsx`, `usePageName.ts`, and sibling section files.
- Colocate behavior-heavy tests with the page or feature they primarily exercise. Keep route-contract and route-search tests under `src/app/tests`.

Most of the code lives in the src folder and looks like this:

```
src
|
+-- app               # application shell (routes, pages, layouts, app-level components)
|
+-- components        # shared components and shadcn/ui components
|
+-- features          # feature based modules (domain-specific functionality)
|
+-- hooks             # shared hooks used across the entire application
|
+-- lib               # re-exporting different libraries preconfigured for the application
|
+-- __mocks__         # mock data and MSW handlers
|
+-- models            # shared data models
|
+-- stores            # global state stores
|
+-- test              # test utilities and mock server
|
+-- utils             # shared utility functions
```

### App Folder (`src/app/`)

The `app` folder contains the application shell and routing infrastructure:

```
src/app
|
+-- routes            # TanStack Router file-based routes
|
+-- pages             # page components rendered by routes
|
+-- layouts           # layout components (e.g., PageLayout)
|
+-- components        # app-level components (AppHeader, AppSidebar, etc.)
|
+-- hooks             # app-level hooks
|
+-- types             # app-level types
|
+-- utils             # app-level utility functions
|
+-- routeTree.gen.ts  # auto-generated route tree (should be committed)
```

### Features Folder (`src/features/`)

For maintainable scaling, the application uses feature-based folders. Each feature folder contains domain-specific code, which keeps functionality scoped and separate from shared components.

A feature could have the following structure:

```
src/features/awesome-feature
|
+-- api         # exported API request declarations and api hooks related to a specific feature
|
+-- components  # components scoped to a specific feature
|
+-- hooks       # hooks scoped to a specific feature
|
+-- types       # typescript types for TS specific feature domain
|
+-- utils       # utility functions for a specific feature
|
+-- index.ts    # entry point for the feature, it should serve as the public API of the given feature and exports everything that should be used outside the feature
```
