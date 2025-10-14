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
└── .gitignore
```

## Working with Apps

Each app is independent and uses its own package manager:

### Web App (`apps/web/`)
- **Tech**: React 19, TypeScript, Vite, TanStack Router
- **Package Manager**: pnpm
- **Commands**: See `apps/web/CLAUDE.md` for details
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
- **Commands**: See `apps/api/CLAUDE.md` for details
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
