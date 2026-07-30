# Web V2 Convex Connection Plan

## Goal

Connect only `apps/web-v2` to the already-provisioned Convex cloud project and
authenticate it directly with WorkOS AuthKit.

This is infrastructure work only. It will not migrate topics, reviews, or any
other product data to Convex.

## Confirmed Decisions

- Use the local
  [`template-react-vite-authkit`](</Users/kevintram/Projects/Code/convex/convex-templates/template-react-vite-authkit>)
  as the reference implementation.
- Use the template's direct browser AuthKit-to-Convex authentication flow.
- Use a completely separate Convex-managed WorkOS development environment.
- Keep the Convex backend in `apps/web-v2/convex`.
- Connect to the existing Convex cloud project.
- Preserve the current two-process development workflow:
  - `apps/web-v2/run.sh` for Vite
  - `pnpm exec convex dev` from `apps/web-v2` for Convex
- Do not change `run.sh` or the worktree script generator in this change.
- Do not add product features or migrate existing FastAPI/Supabase data.
- Do not add a FastAPI token endpoint, auth bridge, or any other FastAPI
  integration.

## Authentication Boundary

Convex authentication will be owned directly by the Web V2 client:

1. `@workos-inc/authkit-react` runs the WorkOS sign-in and callback flow in the
   browser.
2. `ConvexProviderWithAuthKit` obtains the WorkOS access token.
3. `ConvexProviderWithAuth` supplies that token to `ConvexReactClient`.
4. Convex validates the JWT through `convex/auth.config.ts`.
5. Convex functions use `ctx.auth.getUserIdentity()` for identity.

The existing FastAPI WorkOS environment and sealed-cookie authentication remain
unchanged and are not used by Convex. The Convex-managed WorkOS environment has
its own users, sessions, client ID, redirect configuration, and CORS
configuration.

### Intentional consequence

Direct browser AuthKit and the existing FastAPI sealed cookie are independent
authentication systems. A user created in the Convex-managed WorkOS environment
does not automatically exist in the current FastAPI WorkOS environment. A
direct AuthKit login authenticates Convex but does not create FastAPI's sealed
session cookie. Existing FastAPI-backed Web V2 requests may therefore continue
to trigger their existing FastAPI login flow. Unifying the environments or
sessions is explicitly outside this change.

## Repository Constraints

- Web V2 is a React 19 and Vite application with its own `package.json` and
  `pnpm-lock.yaml`.
- Web V2 currently uses TanStack Query for calls to the cookie-authenticated
  FastAPI service.
- Worktree Web V2 ports are dynamic (`6173 + slot`); this worktree currently
  uses port `6179`.
- AuthKit redirect URIs and CORS origins must exactly match the active Web V2
  origin.
- `apps/web-v2/run.sh` executes Vite directly, so changing the package `dev`
  script alone would not start Convex during worktree development.
- `worktree-scripts/gen-env.sh` updates `VITE_API_URL` in
  `apps/web-v2/.env.local` without replacing unrelated variables. Convex and
  AuthKit variables can coexist in that file.

## Audited Template Baseline

The plan was checked against the clean local template checkout.

The following pieces will follow the local template directly:

- dependency ranges `@workos-inc/authkit-react@^0.16.1` and
  `convex@^1.42.3`;
- project-local `convex/` placement;
- the two WorkOS custom-JWT providers in `convex/auth.config.ts`, including
  issuers, RS256, JWKS URLs, and `applicationID`;
- the template's `convex/tsconfig.json` requirements;
- the `convex.json` development `authKit.configure` and `localEnvVars` shape;
- a module-scoped `ConvexReactClient` using `VITE_CONVEX_URL`;
- `AuthKitProvider` using `VITE_WORKOS_CLIENT_ID` and
  `VITE_WORKOS_REDIRECT_URI`;
- the template's `ConvexProviderWithAuthKit` adapter behavior, including
  `isLoading`, `isAuthenticated`, and `getAccessToken()` adaptation; and
- generated Convex API and server types committed under `convex/_generated/`.

## Explicit Deviations From the Local Template

The complete template cannot be copied byte-for-byte into the existing Web V2
application. These are all planned deviations:

| Area | Deviation | Reason |
| --- | --- | --- |
| Package manager | Use pnpm and update `pnpm-lock.yaml`; do not copy `package-lock.json` | Web V2 is an independent pnpm project |
| Existing versions | Do not replace Web V2's React, React DOM, TypeScript, Vite, or type-package versions with the template's versions | Adding Convex must not upgrade the existing application stack |
| Convex dependencies | Copy the template's `convex` and `@workos-inc/authkit-react` version ranges | These are the only template runtime dependencies required for the connection |
| Development script | Keep `vite --open`; run `pnpm exec convex dev` separately instead of copying `convex dev --start 'vite --open'` | The user selected a two-process workflow and deferred `run.sh` work |
| Build and lint scripts | Keep Web V2's existing build, Vitest, TypeScript, Oxlint, and Oxfmt scripts | The template uses ESLint and Prettier, while this repository does not |
| Convex ESLint plugin | Do not add `@convex-dev/eslint-plugin` in this change | Web V2's lint pipeline is Oxlint-based and cannot consume that ESLint plugin directly |
| Styling | Do not copy Tailwind dependencies, `index.css`, or Tailwind Vite configuration | Web V2 uses StyleX |
| Vite configuration | Preserve TanStack Router, StyleX, branch labeling, Vitest, and the `~` alias; do not copy the template's Vite config or `@` alias | Existing application infrastructure must remain intact |
| App entry point | Insert the template's AuthKit and Convex provider layers around the existing provider tree instead of replacing `src/main.tsx` | Web V2 already initializes its router, TanStack Query, devtools, tooltip, and hide-mode providers |
| Provider source syntax | Preserve the template provider's behavior, but use type-only imports and repository formatting | Web V2 enables `verbatimModuleSyntax`; the template's value-style type imports would fail TypeScript checking |
| Error boundary | Do not copy the template's Tailwind-styled class error boundary; use explicit configuration validation and the existing error-boundary conventions | Avoid importing template UI and multiple-component patterns |
| Demo backend | Do not copy `convex/myFunctions.ts`, `convex/schema.ts`, the `numbers` table, mutation, or action | The user explicitly requested no feature work |
| Validation backend | Add one protected, read-only identity query instead of the demo backend | Required only to prove authenticated Convex connectivity |
| Demo UI | Do not replace Web V2's app with the template's `App.tsx`, auth header, number button, or resource cards | The user explicitly requested no feature work |
| Auth validation UI | Use only a development-only connection/auth probe if browser validation cannot be performed without committed UI | Provides validation without adding a product surface |
| AuthKit environment | Use a Convex-managed WorkOS development environment rather than asking the user to create a standard WorkOS application manually | This is the selected authentication environment |
| Local origin | Replace every template development occurrence of `http://localhost:5173` with this worktree's `http://localhost:6179` | AuthKit callback and CORS origins must match the actual worktree server |
| Preview and production | Omit or leave unconfigured the template's Vercel-specific preview/prod AuthKit blocks and `vercel.json` | Production and preview deployment are explicitly deferred and this repository's target has not been selected |
| Environment example | Do not copy `.env.local.example`; rely on Convex-managed local variable generation and the repository's ignored `.env.local` | The root ignore rules do not use the template's environment-example convention |
| Static assets and metadata | Do not copy the Convex logo, template `index.html`, README, license, package metadata, or repository links | They belong to the standalone demo, not 3gulp |
| Tests | Add repository-style focused tests and run the existing validation pipeline | The template contains no equivalent automated provider tests |
| Formatting | Allow Oxfmt to apply Web V2's formatting instead of preserving template whitespace and semicolons byte-for-byte | Repository formatting checks are authoritative |

Outside the deviations listed above, the Convex and WorkOS configuration and
provider semantics should match the local template. If implementation reveals
another necessary deviation, stop and add it to this section before making that
change.

## Planned Changes

### 1. Install current Convex guidance and dependencies

**Status: Done (2026-07-29).**

From `apps/web-v2`:

- Run `npx convex ai-files install` to install or refresh the managed Convex AI
  guidance.
- Add `convex` using the template's `^1.42.3` range.
- Add `@workos-inc/authkit-react` using the template's `^0.16.1` range.
- Preserve the existing React, Vite, TypeScript, Oxlint, and Oxfmt versions.

Tracked changes from this phase include `package.json`, `pnpm-lock.yaml`, and
the managed Convex guidance files. Generated Convex API and server types remain
part of step 3 after the cloud project is linked.

### 2. Link the existing Convex cloud project

- Run the Convex CLI from `apps/web-v2`.
- Select the already-provisioned team and project.
- Use the project's development deployment for this integration.
- Allow the CLI to write `CONVEX_DEPLOYMENT` and `VITE_CONVEX_URL` to
  `apps/web-v2/.env.local`.
- Do not expose or commit deployment credentials.
- Do not deploy to the production Convex deployment in this initial change.

This may require the user to complete an interactive CLI selection or login.

### 3. Add the app-local Convex backend

Create:

- `apps/web-v2/convex/auth.config.ts`
- `apps/web-v2/convex/auth.ts`
- `apps/web-v2/convex/tsconfig.json`
- generated `apps/web-v2/convex/_generated/` files
- `apps/web-v2/convex.json`

`auth.config.ts` will follow the template's WorkOS custom-JWT configuration:

- WorkOS API issuer;
- WorkOS user-management issuer;
- RS256 validation;
- WorkOS JWKS URL; and
- the configured WorkOS client ID as the application ID.

`auth.ts` will contain one protected read-only query that:

- accepts no user ID from the client;
- calls `ctx.auth.getUserIdentity()`;
- throws `"Not authenticated"` when no verified identity exists; and
- returns only minimal, non-sensitive information needed to verify the
  authenticated connection.

No schema, product table, or mutation is planned.

### 4. Configure AuthKit for the development deployment

Add `apps/web-v2/convex.json` using the template's development `authKit`
structure and the active Web V2 worktree origin:

- redirect URI: `http://localhost:6179/callback`
- application homepage: `http://localhost:6179`
- CORS origin: `http://localhost:6179`
- local `VITE_WORKOS_REDIRECT_URI`:
  `http://localhost:6179/callback`

Allow the Convex CLI to provision and configure a separate Convex-managed
WorkOS development environment. Do not reuse the existing FastAPI WorkOS client
ID, API key, users, or configuration.

The CLI-managed flow should:

- provision the development AuthKit environment;
- configure the callback URI, application homepage, and CORS origin from
  `convex.json`;
- configure `WORKOS_CLIENT_ID` for the Convex development deployment; and
- write `VITE_WORKOS_CLIENT_ID` and `VITE_WORKOS_REDIRECT_URI` to
  `apps/web-v2/.env.local`.

Initial provisioning is interactive and may require Convex team-admin
permissions. Stop for the user to complete the CLI prompts if they cannot be
completed safely in the agent terminal.

The WorkOS API key must never be placed in a `VITE_` variable or committed.

Run `pnpm exec convex dev --once` to push and validate the configuration.

### 5. Wire direct AuthKit and Convex providers

Add a provider module with the same behavior as the local template's
`ConvexProviderWithAuthKit.tsx`, changing only type-only imports and repository
formatting. It will:

- adapt `useAuth()` from `@workos-inc/authkit-react`;
- expose `isLoading`, `isAuthenticated`, and `fetchAccessToken` to
  `ConvexProviderWithAuth`;
- handle token-fetch failures without logging tokens; and
- retain token refresh behavior through AuthKit.

At module scope:

- validate `VITE_CONVEX_URL`;
- create one `ConvexReactClient`; and
- avoid recreating the client during renders.

Wrap the existing Web V2 provider tree with:

1. `AuthKitProvider`
2. the AuthKit-to-Convex provider
3. the existing Web V2 providers and router

Preserve the behavior and relative ordering of:

- `TooltipProvider`
- `HideModeProvider`
- `QueryClientProvider`
- React Query devtools
- TanStack Router

Add typed Vite environment declarations for:

- `VITE_CONVEX_URL`
- `VITE_WORKOS_CLIENT_ID`
- `VITE_WORKOS_REDIRECT_URI`

### 6. Add only the UI required to validate authentication

No product page or navigation item will be added.

Use the smallest temporary or development-only surface that can:

- invoke AuthKit's `signIn()`;
- show whether Convex is loading, authenticated, or unauthenticated; and
- execute the protected read-only Convex query after authentication.

Prefer a development-only connection probe. If browser automation can trigger
and verify authentication without committed UI, omit the probe.

Do not add demo numbers, mutations, schema tables, or copy the template's demo
application.

### 7. Preserve the two-process workflow

Terminal one:

```bash
cd apps/web-v2
pnpm exec convex dev
```

Terminal two:

```bash
apps/web-v2/run.sh
```

Do not modify:

- `apps/web-v2/run.sh`
- `worktree-scripts/add.sh`
- `worktree-scripts/gen-env.sh`
- the Web V2 `dev` script solely to combine processes

## Validation

### Static and unit validation

From `apps/web-v2`:

```bash
pnpm validate
pnpm build
pnpm exec convex dev --once
```

Add focused tests for:

- missing public configuration;
- provider loading and unauthenticated states;
- successful access-token adaptation;
- token-fetch failure; and
- preservation of the existing provider tree.

No FastAPI changes or FastAPI tests are planned.

### Authenticated browser validation

Use a dedicated Playwright CLI session:

1. Start Web V2 and the Convex watcher.
2. Open Web V2 at `http://localhost:6179`.
3. Start direct AuthKit sign-in.
4. Complete the WorkOS redirect back to
   `http://localhost:6179/callback`.
5. Confirm Convex reaches its authenticated state.
6. Confirm the protected Convex query sees a non-null verified identity.
7. Sign out through direct AuthKit.
8. Confirm Convex returns to its unauthenticated state.
9. Clean up the Playwright session.

Existing FastAPI requests are not part of the Convex authentication validation.

## Security Requirements

- Never expose `WORKOS_API_KEY` or `WORKOS_COOKIE_PASSWORD` to Vite.
- Never commit `.env.local`, deployment keys, access tokens, or cookies.
- Never trust a client-provided user ID in Convex functions.
- Require `ctx.auth.getUserIdentity()` in the protected validation query.
- Do not store or log WorkOS access tokens.
- Keep dev and production WorkOS configuration separate.
- Do not weaken JWT issuer, signature, or application validation to make a
  failing token pass.

## Deferred Work

- Migrating product data or functionality to Convex.
- Adding a product schema or mutations.
- Adding a first-class Convex `users` table.
- Integrating Convex with `apps/web`, FastAPI, mobile apps, or the landing site.
- Bridging or unifying Convex and FastAPI authentication.
- Replacing TanStack Query or the existing FastAPI API layer.
- Combining Vite and Convex into one development command.
- Generalizing the Convex-managed AuthKit configuration for dynamic worktree
  ports.
- Convex preview and production deployment configuration.
- Production WorkOS redirect and CORS configuration.

## Remaining Setup Inputs

1. Select the already-provisioned Convex team and project if prompted by the
   CLI.
2. Approve creation or selection of the separate Convex-managed WorkOS
   development environment when prompted.

## References

- [Local Convex React/Vite/AuthKit template](</Users/kevintram/Projects/Code/convex/convex-templates/template-react-vite-authkit>)
- [Adding WorkOS AuthKit to an existing Convex app](https://docs.convex.dev/auth/authkit/add-to-app)
- [Convex automatic AuthKit configuration](https://docs.convex.dev/auth/authkit/auto-provision)
- [Convex authentication overview](https://docs.convex.dev/auth/overview)
- [WorkOS AuthKit React SDK](https://workos.com/docs/sdks/authkit-react)
