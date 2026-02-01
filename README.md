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

We have a system for using git worktrees for parallel development. The workflow is automated by `add-worktree.sh` and a shared slot map:

- **Slot map**: `../worktree-slots.toml` (one level above the worktree). Format:
  ```
  [worktrees]
  "feat/search" = 0
  "fix/auth" = 1
  ```
- **Ports**: API uses `8000 + slot`, Web uses `5173 + slot` (slots `0–15` by default).
- **Per-worktree env**: `add-worktree.sh` copies templates (`../api.env.local`, `../web.env.local`) into:
  - `apps/api/.env`
  - `apps/web/.env.local`
  and fills `API_URL`, `APP_URL`, `CORS_ALLOWED_ORIGINS`, and `VITE_API_URL` with the assigned ports.
- **Worktree config**: `./.worktree.env` is created in each worktree:
  ```
  WORKTREE_SLOT=0
  API_PORT=8000
  WEB_PORT=5173
  API_URL=http://localhost:8000
  APP_URL=http://localhost:5173
  ```
- **Run scripts** (generated per worktree):
  - `apps/api/run.sh` uses the assigned API port.
  - `apps/web/run.sh` uses the assigned Web port.
- **Removal**: `remove-worktree.sh` removes the worktree and deletes its slot assignment from `worktree-slots.toml`.

### WorkOS redirect URIs (finite list)
Because we use `localhost` with fixed ports, whitelist the callback URLs for the slot range:
`http://localhost:8000/callback` through `http://localhost:8015/callback`.

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
