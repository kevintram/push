# Repository Guidelines

## Project Structure & Module Organization
The monorepo splits into `apps/` and `supabase/`; every app is isolated, so avoid cross-app imports. `apps/web` (React/TypeScript) keeps domain code in `src/features/` with reusable UI in `src/components/ui/`. `apps/site` hosts the Astro marketing surface, `apps/api` (FastAPI) stores routers in `app/routers/` with shared plumbing in `app/core/`, and native stacks live in `apps/android/app/src/` and `apps/ios/` (SwiftUI + TCA, tests in `3gulp-iosTests/`). `supabase/` tracks database config and migrations. Check each app’s `CLAUDE.md` before you change it.

## Build, Test, and Development Commands
- `cd apps/web && pnpm install && pnpm dev`; backfill with `pnpm build`, `pnpm preview`, `pnpm test`, `pnpm test:e2e[:ci]`, and `pnpm lint` or `pnpm format`.
- `cd apps/site && pnpm dev` to preview Astro; `pnpm build` emits the static bundle.
- `cd apps/api && uv sync`; run `uv run fastapi dev app/main.py`, `uv run fastapi run`, and `uv run ruff check app` / `uv run ruff format app`.
- `cd apps/android && ./gradlew build` or `./gradlew test`; for iOS use `open apps/ios/3gulp-ios.xcodeproj` or `xcodebuild test -scheme 3gulp-ios` after `swift format -i <path>`.

## Coding Style & Naming Conventions
Biome (`pnpm format`) governs web code—keep React components PascalCase, files camelCase or kebab-case, and always use Day.js for dates. FastAPI modules stay snake_case with four-space indentation and colocated Pydantic models; Ruff handles formatting. Kotlin packages remain lowercase and feature-scoped. Swift targets Swift 6 with two-space indentation, async/await, and isolates AppKit bridges via `NSViewRepresentable`.

## Testing Guidelines
Co-locate React unit specs (`FeatureName.test.tsx`) and reuse helpers from `apps/web/src/test/`; run Playwright suites in `apps/web/tests/` with a dev server. Place pytest suites under `apps/api/tests/` mirroring `app/` and execute with `uv run pytest`, mocking Supabase I/O when required. Android tests run through `./gradlew test`, and iOS/macOS checks go through `xcodebuild test -scheme 3gulp-ios`. Keep critical flows covered before merging.

## Commit & Pull Request Guidelines
Use Conventional Commits with scoped prefixes (`feat(web): …`, `fix(api): …`, `chore: …`) and subjects under 72 characters; squash WIP commits. PRs should document user impact, list verification (`pnpm validate`, `uv run pytest`, `./gradlew build`, screenshots), link issues, and call out migrations or toggles. Confirm linting, tests, and migrations before requesting review.

## Worktree & Environment Tips
Create branches with `./add-worktree.sh <branch>` so dependencies and env symlinks are prepared automatically. Never commit `.env*` files, and verify each worktree keeps the correct symlinked secrets.
