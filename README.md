# 3gulp Monorepo

This repository contains the 3gulp applications.

## Repository structure

```text
apps/
├── web/       # React/Vite application with Clerk and Convex
├── site/      # Astro marketing site
├── android/   # Android app (development not started)
└── ios/       # iOS app (development not started)
```

## Web app

The primary application lives in `apps/web/` and uses React, TypeScript, Vite,
TanStack Router, Clerk, and Convex.

```bash
cd apps/web
pnpm install
pnpm dev
```

Other useful commands are `pnpm run lint`, `pnpm test:ci`, `pnpm run build`,
and `pnpm run validate`.

## Marketing site

The Astro site lives in `apps/site/`.

```bash
cd apps/site
pnpm install
pnpm dev
```

## Environment

Copy `apps/web/.env.example` to `apps/web/.env.local` and set
`VITE_CLERK_PUBLISHABLE_KEY` and `VITE_CONVEX_URL`. Copy
`apps/site/.env.example` to `apps/site/.env` and set `PUBLIC_APP_URL`.

The site login button redirects to `PUBLIC_APP_URL`. Configure that variable
for the deployed site to point to the deployed app.

## Commit guidelines

Use `<scope>: <description>` for commits. Scopes include `web`, `site`,
`android`, and `ios`; omit the scope for repository-wide changes.

```text
web: add review filters
site: improve landing page copy
update root ignore rules
```
