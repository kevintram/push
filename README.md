# 3gulp Monorepo

This is a monorepo containing all 3gulp applications and services.

## Repository Structure

```
3gulp-mono/
├── apps/
│   ├── web/          # React/Vite web application (pnpm)
│   ├── site/         # Astro marketing site (pnpm)
│   ├── api/          # FastAPI backend (Python/uv)
│   ├── android/      # Android app (Kotlin/Gradle)
│   └── ios/          # iOS app (Swift/Xcode)
├── supabase/         # Supabase configuration, migrations, and seeds
└── .gitignore
```

## Working with Apps

Each app is independent and uses its own package manager:

### Web App (`apps/web/`)
- **Tech**: React 19, TypeScript, Vite, TanStack Router
- **Package Manager**: pnpm
```bash
cd apps/web
pnpm install
pnpm dev
```

Web app linting rules:
- React/TSX component files are limited to 500 lines.
- Component files may define at most 2 React components.
- `pnpm run lint` enforces TypeScript checks, Biome linting, and the component-count check.
- `pnpm run validate` runs `lint`, `test:ci`, and `test:e2e:ci`.

### Marketing Site (`apps/site/`)
- **Tech**: Astro, TypeScript
- **Package Manager**: pnpm
```bash
cd apps/site
pnpm install
pnpm dev
```

### API (`apps/api/`)
- **Tech**: FastAPI, Python 3.12+
- **Package Manager**: uv
```bash
cd apps/api
uv sync
fastapi dev app/main.py
```

### Android App (`apps/android/`)
- **Tech**: Kotlin, Gradle
- **Build Tool**: Gradle
```bash
cd apps/android
./gradlew build
```

### iOS App (`apps/ios/`)
- **Tech**: Swift, Xcode
- **Build Tool**: Xcode
```bash
cd apps/ios
open 3gulp-ios.xcodeproj
```

## Development

Each application maintains its own:
- Dependencies
- Build configuration
- Development workflow
- Documentation (see respective CLAUDE.md files)

## Worktrees

Git worktrees enable parallel development with isolated ports. Each worktree gets a slot *S* (0–15) that determines its ports (API `8000 + S`, Web `5173 + S`).

- **Setup** (`worktree/add.sh`):
  1. Claims a slot in `worktree-slots.toml`
  2. Generates all environment files via `worktree/gen-env.sh`: `.worktree.env`, `.env`, `apps/api/.env`, and `apps/web/.env.local`
  3. Generates run scripts for api and web: `apps/api/run.sh` and `apps/web/run.sh`
- **Dev servers**: Use `apps/api/run.sh` and `apps/web/run.sh` to start on assigned ports (runs `gen-env.sh` to refresh env files and recreate any missing ones).
- **Teardown**: `worktree/remove.sh` removes the worktree and frees its slot.

### WorkOS redirect URIs
Whitelist `http://localhost:8000/callback` through `http://localhost:8015/callback` for the slot range.

## Commit Guidelines

This project follows [Conventional Commits](https://www.conventionalcommits.org/):
- Format: `<type>(<scope>): <description>`
- Types: `feat`, `fix`, `refactor`, `style`, `docs`, `test`, `chore`
- Scopes: `web`, `site`, `api`, `android`, `ios`, or omit for repo-wide changes

Examples:
```
feat(web): add dark mode toggle
fix(api): handle non-existent user edge case
chore: update root .gitignore
```
