# Making 3gulp Feel Fast: Recommendation

**Date:** 2026-06-12 (consolidates research from 2026-06-11)
**Question:** The web app feels slow due to network latency. Do we add optimistic mutations to the current stack, or adopt a sync engine (Convex, Zero, ElectricSQL, InstantDB)? The solution should be compatible with planned native iOS/Android apps; a full backend rewrite is on the table.

---

## The recommendation

**Don't rewrite the backend to fix latency.** The slowness is a frontend write-path problem, fixable in phases:

1. **Now (days):** True optimistic mutations with TanStack Query's `onMutate`/rollback pattern, plus router-loader prefetching. This alone should kill the sluggish feel.
2. **Next (weeks, incremental):** TanStack DB collections over the existing API, optionally with ElectricSQL for the read path. Sync-engine UX (live queries, instant local writes, automatic rollback) while keeping FastAPI + Supabase and the SQL/ltree schema.
3. **Decision gate — defer until native development actually starts:** choose between REST API + hand-rolled optimistic UI on native (status quo backend, cheapest) and a **Convex** rewrite (only if you also want first-party live sync on native and accept leaving Postgres). The landscape may shift before then — Zero may grow native clients; Electric's native ecosystem may mature.

Eliminated: **InstantDB** (weakest native story, replaces the backend) and **Supabase-native** (we already ran that experiment in 2025 and ripped it out — see below). Deferred: **Zero** (1.0 is days old, web-only; re-evaluate in 6–12 months).

---

## Diagnosis: why the app feels slow

Verified against `apps/web` and `apps/api` on 2026-06-11:

- **No optimistic updates exist.** All 26 query/mutation operations across the 5 modules (review-cards, topics, reviews, search, shell) use post-confirmation cache writes: `onSuccess` → `queryClient.setQueryData()`. Every mutation blocks perceived UI on a full round trip (browser → FastAPI → Supabase → back).
- **No realtime/streaming.** No WebSockets or SSE; `useDueFocusStream` is in-memory pagination, not server push.
- **The backend is small but server-authoritative where it counts.** 26 endpoints, 3 core tables. The real logic: FSRS scheduling (Python `fsrs` lib, with before/after snapshots written to `reviews`), the review queue (`apps/api/app/review_cards/service.py`, 655 lines: retrievability-tier ordering, filtering, pagination, shuffle), and an ltree topic hierarchy with trigger-maintained paths and cascade deletes.
- **Auth:** WorkOS sealed-cookie sessions, validated per request. No RLS; `user_id` filtering in app code.

This is not a backend throughput problem. Any option below fixes the feel; they differ enormously in cost.

---

## Phase 1: Optimistic mutations on the current stack (days)

TanStack Query v5 has first-class support. The work:

- Add `onMutate` handlers that snapshot cache state, write the optimistic value, and return rollback context; `onError` restores the snapshot. The hot-path mutations are a small subset of the 26 operations: create review (rating a card), update/flag card, create/update topic.
- The one hard case: **rating a card** changes server-computed FSRS state (`stability_after`, `due_after`, queue position). Don't try to compute the post-state client-side — optimistically *remove the card from the queue* (the visible effect) and let the server response reconcile the FSRS fields. UX win without duplicating the algorithm.
- Cheap read-path wins alongside: TanStack Router loader prefetching, `placeholderData: keepPreviousData`, hover-prefetch on topic links.

**Risk:** low — rollback is manual per-mutation, but the surface is small.

## Phase 2: TanStack DB (+ optional ElectricSQL) — sync-engine UX, keeps Postgres (weeks)

- **TanStack DB** (same team as Query/Router) adds collections, differential live queries, and optimistic writes with *automatic* rollback as a layer over the existing API — backend-agnostic via custom `mutationFn`. It's the natural graduation from Phase 1, not a competing stack. Introduce module-by-module (review-cards first); web-v2 is a natural place to build the pattern from scratch if revived.
- **ElectricSQL** adds read-path sync only: it streams Postgres "shapes" into the client through your own cookie-checked API proxy, and *writes go through existing FastAPI endpoints unchanged*. Composes directly with TanStack DB's Electric collection type. Add it if multi-device liveness becomes wanted.
- Keeps ltree, triggers, FSRS-in-Python, SQL — everything. Server stays authoritative for scheduling.
- **Native:** doesn't help. iOS/Android would consume the REST API conventionally (Electric's Swift client is a hobby project today — v0.0.2, ~20★).

**Risk:** TanStack DB is young (~1.0); Electric itself is GA and production-proven.

Compatibility findings (verified against Electric shapes guide and TanStack DB live-queries guide; note electric-sql.com now redirects to **electric.ax**):

| Our shape/logic | Electric + TanStack DB fit |
|---|---|
| ltree hierarchy + path triggers | ⚠️ Shapes are strictly single-table; where-clauses don't support ltree or enums. Pattern: sync the whole per-user `topics` table (`user_id = $user` is supported text equality), do tree logic client-side via TanStack DB joins. Per-user tree is small, so fine. |
| FSRS + snapshots | ✅ Zero risk — writes stay on FastAPI; Python FSRS remains authoritative. |
| Review queue | ✅ Live queries support joins, chained where, incremental orderBy, groupBy, limit/offset — enough to run the queue client-side at per-user scale. Caveat: retrievability decays, so a live query needs a ticking "now" input. **Escape hatch: keep the queue as a FastAPI endpoint** — hybrid is the documented Electric pattern. |
| Enums, generated columns | ⚠️ Filter/compute client-side (`effective_date` is a coalesce). Generated-column replication is low-confidence — verify in a spike. |
| `X-Client-Date` timezone handling | ✅ Gets easier — "due today" becomes client-local. |
| Multi-tenancy | ✅ Shapes gated by the authenticated API proxy with `user_id` filter. |

## Decision gate: Convex, if and only if native + rewrite

What's genuinely strong (verified against Convex docs 2026-06-11):

- **Only first-party native story in the field:** official open-source Swift and Kotlin clients with live subscriptions (Kotlin returns `Flow`s), mutations, and actions.
- **Official WorkOS AuthKit integration** (JWT validated against AuthKit's public key). Means moving off sealed-cookie sessions; native auth goes through the custom OIDC `AuthProvider` interface (documented, but DIY for WorkOS).
- Mature platform, FSL open-source backend, self-hostable.

What the rewrite actually costs for *this* app:

- **FSRS ports to TypeScript.** `ts-fsrs` is FSRS v6, actively maintained, same `open-spaced-repetition` org as our Python dep — tractable, but needs golden tests for py-fsrs ↔ ts-fsrs parity.
- **ltree must be remodeled** (document-relational store; no ltree, no triggers): path strings or parent pointers, with maintenance moved from Postgres triggers into mutation code. Largest piece of the rewrite.
- **The 655-line queue service rewrites** as Convex queries/indexes; per-function document-read limits push history/logbook queries toward indexed pagination and queue summaries toward denormalized counters.
- **Native latency is not automatically solved:** the Swift/Kotlin SDKs document no offline support and no optimistic layer — reads are live-reactive, but writes still round-trip. You'd hand-roll optimistic UI on native just like on web today.
- Exit cost is real: data export is fine; the function/query layer is the lock-in (per Convex's own migration-away writeup).

**The structural risk asymmetry that drives the phased recommendation:** with Electric/TanStack DB, every misfit has a fallback — leave that piece on FastAPI and sync only what fits. With Convex there is no partial mode: ltree remodel, queue rewrite, FSRS port, and pagination design must all land before anything ships.

---

## Eliminated and deferred options

### Zero (Rocicorp) — deferred, re-evaluate in 6–12 months

Best conceptual fit for the write path: custom mutators run optimistically on-client, then replay on *your* server push endpoint — which can be any language, so FastAPI could remain the FSRS authority. Auth is the easiest of any option: cookie forwarding (`ZERO_QUERY_FORWARD_COOKIES` / `ZERO_MUTATE_FORWARD_COOKIES`) reuses the WorkOS sealed-cookie session as-is. Disqualifiers today: no native clients and an explicitly web-focused roadmap; Postgres type gaps (no views, no arrays — ltree almost certainly unsupported); 232 KB gzipped client; 1.0 shipped 2026-06-08 and is days old.

### InstantDB — eliminated

Nice web DX (optimistic + offline by default), but no official Swift SDK (community one: v0.2.1, 11★), no Kotlin SDK, and it replaces the backend with its triple-store model. Native apps are a stated requirement.

### Supabase-native (drop FastAPI, use PostgREST + RLS + Edge Functions) — eliminated; we already ran this experiment

On paper it's attractive: zero data remodel (keeps ltree, triggers, enums, generated columns), WorkOS is now a first-class third-party auth provider (enabling DB-level RLS tenancy), official Swift SDK, feature-complete community Kotlin SDK.

But **the app used supabase-js from July–Oct 2025 and ripped it out for FastAPI on 2025-10-30** (`182ce576`, migrations `ddebe049`…`cab304b8`), and the pre-removal code shows the structural failure mode on a *simpler* domain than today's:

- No client-side transactions in PostgREST → multi-table logic leaked into plpgsql RPCs (`insert_todo_with_topics`, `insert_relationship`, `get_potential_children/parents`).
- Client-side join waterfalls (`useTopicWithRelationships`: fetch `topics_closure` → extract IDs → `.in('id', ids)`) — N+1 round trips.
- Computed values required views; queries embedded in components coupled schema to UI.

Today's domain is strictly heavier in server logic (atomic FSRS rating transaction, retrievability-ordered queue, ltree operators absent from PostgREST's filter grammar → subtree queries become RPCs too). Going back would rebuild the ripped-out architecture with *more* of the app in plpgsql/Edge Functions, and it doesn't even fix perceived latency — PostgREST is still request/response; Realtime is change notifications, not a sync engine. What changed since 2025 (first-class WorkOS auth, maturer Edge Functions) doesn't change the structural problem.

**The 2025 lesson, stated precisely: architectures with no owned server-logic tier fail for this domain.** Convex passes this test — its unit of API is a server-side TypeScript function and every mutation is a serializable transaction, so the FSRS rating operation is the native idiom, not an escape hatch. The TanStack DB path keeps the existing FastAPI tier. (Its client-side joins superficially resemble the old `topics_closure` waterfall, but run in memory against locally-synced collections — zero network round trips, eliminating exactly what made client joins bad. The one trap: never compute server-authoritative FSRS post-states optimistically.) The salvageable idea from the 2025 era is RLS as defense-in-depth, addable to the current stack today.

---

## On "the backend is a mess"

The mess (verified by inspection) is mostly: duplicated FSRS state columns (own + inherited × 5), the 655-line queue service, 67 migrations of schema churn, and app-layer-only tenancy. **No sync engine makes this complexity disappear — they relocate it.** FSRS math, queue ordering, and hierarchy maintenance must live *somewhere* authoritative. A Convex rewrite forces re-deriving all of it in TypeScript at once; staying on Postgres allows incremental refactoring (add RLS, extract a scheduling module, collapse the inherited-state columns) without coupling cleanup to a platform bet. If the rewrite urge is really about code quality, a targeted refactor of `review_cards/service.py` plus RLS is far cheaper than a migration and prerequisite-free.

---

## Options at a glance

| | Latency fix (web) | Native iOS/Android | Keeps Postgres/FastAPI | WorkOS auth | Maturity (mid-2026) | Cost |
|---|---|---|---|---|---|---|
| **Optimistic mutations (TanStack Query)** | ✅ writes feel instant | ➖ N/A | ✅ | ✅ unchanged | ✅ boring, proven | Days |
| **TanStack DB (+ Electric reads)** | ✅ live queries, auto rollback | ➖ web-only | ✅ | ✅ unchanged | DB ~1.0; Electric GA | Weeks, incremental |
| **Convex** | ✅ reactive queries | ✅ official Swift + Kotlin (no offline) | ❌ full rewrite | ✅ official AuthKit (JWT) | ✅ mature, GA | Months |
| **Zero** | ✅ custom mutators | ❌ none | ✅ (push endpoint any language) | ✅ cookie forwarding | ⚠️ 1.0 days old | Weeks–months |
| **InstantDB** | ✅ | ❌ weakest | ❌ | ⚠️ | ⚠️ | Months |
| **Supabase-native** | ❌ still request/response | ✅ Swift official, Kotlin community | ⚠️ keeps Postgres, kills FastAPI | ✅ third-party provider | ✅ | Months — and we already reverted it once |

---

## Sources & verification

The deep-research workflow's adversarial-verification phase was cut short by API rate limits — its verdicts are "unverified," not refuted. Load-bearing claims were manually re-verified 2026-06-11:

- Zero 1.0 (2026-06-08), web-only, Postgres type gaps — [InfoQ](https://www.infoq.com/news/2026/06/zero-version-1/)
- Convex official Swift client, custom OIDC, no offline — [docs.convex.dev/client/swift](https://docs.convex.dev/client/swift)
- Convex official Kotlin client, Flow subscriptions, no offline — [docs.convex.dev/client/android](https://docs.convex.dev/client/android)
- Convex × WorkOS AuthKit integration — [docs.convex.dev/auth/authkit](https://docs.convex.dev/auth/authkit/)
- Electric shape capabilities/limits — [electric.ax/docs/guides/shapes](https://electric.ax/docs/guides/shapes)
- TanStack DB live-query capabilities — [tanstack.com/db live queries](https://tanstack.com/db/latest/docs/guides/live-queries)
- ts-fsrs (FSRS v6, maintained, release 2026-06-06, 685★) — [github.com/open-spaced-repetition/ts-fsrs](https://github.com/open-spaced-repetition/ts-fsrs)
- Supabase third-party auth (WorkOS), [Swift](https://supabase.com/docs/reference/swift/introduction) and [Kotlin](https://supabase.com/docs/reference/kotlin/introduction) SDKs — [supabase.com/docs/guides/auth/third-party/overview](https://supabase.com/docs/guides/auth/third-party/overview)

Also consulted: [TanStack Query optimistic updates](https://tanstack.com/query/v5/docs/react/guides/optimistic-updates), [TanStack DB overview](https://tanstack.com/db/latest/docs/overview) and [mutations guide](https://tanstack.com/db/latest/docs/guides/mutations), [Zero auth](https://zero.rocicorp.dev/docs/auth) and [custom mutators](https://zero.rocicorp.dev/docs/custom-mutators), [Electric: local-first with your existing API](https://electric-sql.com/blog/2024/11/21/local-first-with-your-existing-api), [instant-swift-sdk](https://github.com/tornikegomareli/instant-swift-sdk), [ElectricSync (Swift)](https://github.com/paulharter/ElectricSync), [Convex: how hard is it to migrate away](https://stack.convex.dev/how-hard-is-it-to-migrate-away-from-convex). Pricing/self-hosting specifics were not deeply verified.

Codebase facts (TanStack Query usage, no optimistic updates, FSRS/ltree/queue architecture, WorkOS sealed cookies, supabase-js removal history) were verified directly against the repo and git history on 2026-06-11.
