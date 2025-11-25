# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

3gulp is a learning application that incorporates cognitive science principles beyond traditional SRS (Spaced Repetition Systems) and active recall. The application considers scaffolding, variability effect, encoding, interleaving, expertise reversal effect, and other evidence-based learning techniques.

This is a **monorepo** containing multiple independent applications that share a common purpose but use different tech stacks:
- **Web** (React/TypeScript)
- **Site** (Astro marketing site)
- **API** (FastAPI/Python)
- **Android** (Kotlin/Gradle)
- **iOS** (Swift/Xcode)
- **Supabase** (shared database configuration, migrations, and seeds at root level)

## Monorepo Structure

Each app is **completely independent** with its own:
- Package manager
- Dependencies
- Build configuration
- Development workflow
- CLAUDE.md file (refer to app-specific CLAUDE.md for detailed guidance)

## Development Commands

### Web App (`apps/web/`)
```bash
cd apps/web
pnpm install
pnpm dev           # Start dev server
pnpm build         # Build for production
pnpm test          # Run tests in watch mode
pnpm lint          # Run all linting
pnpm validate      # Run full validation pipeline
```
**Tech**: React 19, TypeScript, Vite, TanStack Router, Tailwind CSS v4, shadcn/ui
**See**: `apps/web/CLAUDE.md` for detailed architecture and development guidelines

### Marketing Site (`apps/site/`)
```bash
cd apps/site
pnpm install
pnpm dev           # Start dev server
```
**Tech**: Astro, TypeScript

### API (`apps/api/`)
```bash
cd apps/api
uv sync                    # Install dependencies
fastapi dev app/main.py    # Start dev server with auto-reload
uv add <package>           # Add dependency
```
**Tech**: FastAPI, Python 3.12+, uv package manager
**See**: `apps/api/CLAUDE.md` for detailed architecture and development guidelines

### Android App (`apps/android/`)
```bash
cd apps/android
./gradlew build
```
**Tech**: Kotlin, Gradle

### iOS App (`apps/ios/`)
```bash
cd apps/ios
open 3gulp-ios.xcodeproj
swift format -i <path>     # Format code
```
**Tech**: Swift, SwiftUI, TCA (The Composable Architecture)
**See**: `apps/ios/CLAUDE.md` for detailed development guidelines

## Git Worktree Workflow

This monorepo uses git worktrees for parallel development. Use the included script to create new worktrees:

```bash
./add-worktree.sh <branch-name>
```

This script will:
1. Create a new worktree from the current branch
2. Set up environment file symlinks (web.env.local, api.env.local)
3. Install dependencies for all apps (pnpm, uv)
4. Push and set upstream for the new branch

**Note**: Environment files are stored in the parent directory and symlinked into worktrees.

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

## Architecture Notes

### Web App Architecture
- **Feature-based structure**: Code organized by domain/feature in `src/features/`
- **Routing**: TanStack Router with file-based routing (type-safe)
- **Data fetching**: TanStack Query + FastAPI backend
- **Date handling**: Always use Day.js (never native Date)
- **UI Components**: Prefer shadcn/ui components from `src/components/ui/`
- **Testing**: Vitest (unit), Playwright (E2E), MSW (mocking)

### API Architecture
- **Router pattern**: Feature-based routers in `app/routers/`
- **Dependency injection**: FastAPI's DI system for auth and shared logic
- **Authentication**: Query token (global) + header token (protected routes)
- **Documentation**: Auto-generated at `/docs` (Swagger) and `/redoc`

### iOS Architecture
- **SwiftUI-first**: Use AppKit only when necessary via NSViewRepresentable
- **State management**: TCA (The Composable Architecture)
- **Dependencies**: Dependencies library integrated with TCA
- **Modern APIs**: Target latest iOS/Swift 6 with async/await and macros
- **Code style**: 2-space indentation, minimal comments

## Important Patterns

1. **App Independence**: Never create cross-app dependencies. Each app should be independently runnable.

2. **App-Specific Details**: Always check the app-specific CLAUDE.md files for detailed guidance before making changes to an app.

3. **Environment Files**: In worktree workflow, env files are symlinked from parent directory. Never commit `.env.local` or `.env` files.

4. **Package Managers**:
   - Web/Site: `pnpm`
   - API: `uv`
   - Android: `gradle`/`gradlew`
   - iOS: Xcode/Swift Package Manager
