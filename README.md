# Push

Push is a React/Vite web app backed by Clerk and Convex, deployed to
https://push.kevintram.com.

## Development

```bash
pnpm install
pnpm dev
```

Other useful commands are `pnpm run lint`, `pnpm test:ci`, `pnpm run build`,
and `pnpm run validate`.

## Environment

Copy `.env.example` to `.env.local` and set `VITE_CLERK_PUBLISHABLE_KEY` and
`VITE_CONVEX_URL`.

## Commit guidelines

Use `<scope>: <description>` for commits. Use the `web` scope for app changes;
omit the scope for repository-wide changes.

```text
web: add review filters
update root ignore rules
```
