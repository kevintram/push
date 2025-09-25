# Repository Guidelines

## Project Structure & Module Organization
- `src/` holds application code: `features/` for domain flows, `components/` for shared UI, `routes/` for TanStack route files, and `providers/` plus `lib/` for cross-cutting glue.
- UI primitives that mirror shadcn live under `src/components/ui/`; reuse them instead of duplicating markup.
- Unit tests sit beside components (for example `App.test.tsx`), while end-to-end specs live in `tests/` and Supabase SQL lives in `supabase/migrations/`.
- Static assets come from `public/`; adjust MSW worker files there when mocking APIs.

## Build, Test, and Development Commands
- Use `pnpm dev` to launch Vite with hot reload; it opens the app automatically.
- Run `pnpm build` for a production bundle and `pnpm preview` to smoke-test the built output.
- `pnpm test` starts Vitest in watch mode, while `pnpm test:ci` runs the suite headlessly; pass `--coverage` if you need a report.
- Execute `pnpm test:e2e` for Playwright’s interactive runner and `pnpm test:e2e:ci` for headless checks; ensure the dev server is running first.
- Keep quality gates green with `pnpm lint:tsc` (type safety), `pnpm lint:biome` (Biome lint/fix pass), and the aggregated `pnpm validate` task before opening a PR.

## Coding Style & Naming Conventions
- Biome enforces tab indentation, single quotes for JSX/TS, no semicolons unless required, and sorted imports/attributes; let `pnpm format` handle bulk cleanups.
- Follow the enforced filename cases (camelCase, kebab-case, PascalCase) and group route modules under `src/routes` using TanStack’s generated `routeTree.gen.ts`.
- Prefer functional React components with inline hooks; keep stateful logic in `contexts/` or `providers/`.
- Guard new environment-driven logic with `import.meta.env` checks to preserve Vitest compatibility.

## Testing Guidelines
- Unit tests should mirror the module name (`FeatureName.test.tsx`) and rely on Testing Library helpers from `src/test/` for consistent queries.
- Mock network calls with MSW; enable the worker locally via `ENABLE_MSW_TESTS=development` when exercising mocked flows in the browser.
- Maintain or increase coverage when touching critical routes, and capture regression cases for bug fixes before committing the fix.

## Commit & Pull Request Guidelines
- Adopt the existing Conventional Commit pattern (`feat:`, `fix:`, `chore:`) visible in `git log` so automated changelog tools remain effective.
- Squash minor WIP commits locally; keep messages focused on the surface-level behavior change.
- PRs should describe the user impact, list verification steps (`pnpm validate`, manual QA), link the relevant issue, and include screenshots or screen captures for UI changes.
- Request a review before merging and mention any toggles, migrations, or Supabase config updates that require coordination.
