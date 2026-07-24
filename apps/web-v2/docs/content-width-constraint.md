# Spec: Constrain main content width (web-v2)

**Status:** Proposed
**Scope:** `apps/web-v2`
**Branch:** `claude/webv2-content-width-constraint-m0rqm3`

## Problem

Main content currently stretches to fill whatever horizontal space is left after
the sidebars. On wide viewports this produces uncomfortably long line lengths and
oversized content blocks. We want to cap the main content at a fixed maximum
width and center it — **without** constraining sidebars, which should keep sitting
adjacent to the content and at their own widths.

## Goals

- Constrain **main content** to a maximum width of **`805px`**.
- Main content **fills the available space** up to that cap, then **centers**
  within that space.
- Applies to **every page's** main content region (including simple placeholder
  pages), for one consistent content width across the app.
- `805px` lives in exactly **one** place.

## Non-goals

- Sidebars (`AppSidebar`, `LibrarySidebar`, `ReviewSidebar`, `ReviewsSidebar`)
  are **not** constrained and keep their current widths/behavior.
- No change to per-page scroll behavior.
- No change to the `/design-system` dev page.
- Not reworking navigation, data fetching, or routing.

## Decisions (confirmed)

| Question | Decision |
|---|---|
| How the column sits next to a sidebar | **Center in leftover space** — equal gaps on both sides of the capped column within the space beside the sidebar. |
| Review Card tab toolbar (back-link + Overview/Review tabs) | **Full-width toolbar** — treated as page chrome; only the content bodies below it are constrained. |
| Which pages | **All pages** — including Home, Flagged, Recent, Pinned, Settings. |
| Component name | **`ContentColumn`** |
| Meaning of `805px` | **Border-box** width of the column (page padding sits inside it; `box-sizing: border-box` is already global). |

## Current layout model

Everything renders inside one scroll container: `AppShell`'s `<main>` (a flex row
— `AppSidebar` on the left, `<Outlet/>` filling the rest). The wrinkle is that the
**other** sidebars live *inside* that Outlet, as flex siblings of the actual
content. So the cap must be applied to each page's content region specifically,
not to one high-level element.

| Route(s) | Content region today | Adjacent sidebar(s) |
|---|---|---|
| `/` (Home) | `HomePage` `<main>` | none |
| `/flagged` `/recent` `/pinned` | `BasicRoutePage` `<main>` | none |
| `/settings` | `SettingsPage` `<main>` | none |
| `/library/` | `LibraryPage` `<div>` | left: `LibrarySidebar` (240px) |
| `/library/$topicId` | `TopicPage` container (`flexGrow:1`) | left: `LibrarySidebar` |
| `/review/due·new·late` | `ReviewPageLayout` `innerContainer` (`flexGrow:1`) | left: `ReviewSidebar` |
| `/review-cards/$id` (overview) | `ReviewCardPageOverview` `styles.main` (`flexGrow:1`) | right: `ReviewsSidebar` (320px) + top tab toolbar |
| `/review-cards/$id/reviews` | `ReviewCardPageReviews` `styles.page` | top tab toolbar |

## Approach

### 1. Width token (single source of truth)

Add to `src/styles/tokens.stylex.ts`:

```ts
export const layout = stylex.defineVars({
  contentMaxWidth: '805px',
})
```

### 2. `ContentColumn` component

New file `src/components/ContentColumn.tsx`:

```tsx
import * as stylex from '@stylexjs/stylex'
import type { ReactNode } from 'react'

import { layout } from '~/styles/tokens.stylex'

const styles = stylex.create({
  column: {
    width: '100%',
    maxWidth: layout.contentMaxWidth,
    marginInline: 'auto',
    minWidth: 0,
  },
})

type ContentColumnProps = {
  children: ReactNode
  xstyle?: stylex.StyleXStyles
}

export function ContentColumn({ children, xstyle }: ContentColumnProps) {
  return <div {...stylex.props(styles.column, xstyle)}>{children}</div>
}
```

Design notes:

- Deliberately **just** the capped, auto-centered column. It drops inside
  whatever full-width region already claims the leftover space:
  - a `flexGrow` region beside a sidebar, or
  - the AppShell `<main>` when there's no sidebar.
- `marginInline: auto` centers it in both **block** and **column-flex** parents,
  which covers every case here — this is how we get "center in leftover".
- The page's own `padding` / `gap` / `flexDirection` ride in via the `xstyle`
  prop, matching the existing `xstyle` convention (`Textarea`, `Tabs`).

### 3. Per-page application

Sidebars are never touched.

| File | Change |
|---|---|
| `app/pages/HomePage.tsx` | Root `<main>` → `<ContentColumn xstyle={styles.page}>` inside AppShell's `<main>`. Removes the nested `<main>`. Reconcile the `min(100%, 760px)` hero to fill the 805 column. |
| `app/pages/BasicRoutePage.tsx` | Root `<main>` → `<ContentColumn xstyle={styles.page}>`. Removes nested `<main>`. |
| `app/pages/SettingsPage.tsx` | Root `<main>` → `<ContentColumn xstyle={styles.page}>`. Removes nested `<main>`. |
| `app/pages/ReviewPageLayout.tsx` | Wrap `<Outlet/>` in `<ContentColumn>` inside `innerContainer` (covers due/new/late at once; keeps its existing scroll + padding). |
| `app/pages/LibraryPageLayout.tsx` | Wrap `<Outlet/>` in a `flexGrow` region so the layout owns space distribution. |
| `app/pages/LibraryPage.tsx` | Render `<ContentColumn xstyle={styles.container}>` as root. |
| `app/pages/TopicPage.tsx` | Render `<ContentColumn xstyle={column}>` as root; the current `flexGrow` moves up to the layout region, `padding`/`gap`/`flexDirection` move into the column style. |
| `app/pages/ReviewCardPage/ReviewCardPageOverview.tsx` | Keep the `[main │ ReviewsSidebar]` row; `main` stays the `flexGrow` region, wrap its textareas in `<ContentColumn>` → 805 column centers in the space left of the sidebar. |
| `app/pages/ReviewCardPage/ReviewCardPageReviews.tsx` | Wrap content in `<ContentColumn>`. |
| `app/pages/ReviewCardPage/ReviewCardPageLayout.tsx` | **Unchanged** — tab toolbar stays full-width chrome. |

## Behavior details / edge cases

- **No-sidebar pages:** the region is the AppShell `<main>` (full width); the
  column centers within it. Page padding sits inside the 805 column.
- **Left-sidebar pages (Library, Review):** the layout's `flexGrow` region takes
  the leftover space; the column centers within it with symmetric gaps.
- **Right-sidebar page (Review Card overview):** the column centers in the space
  to the *left* of the 320px `ReviewsSidebar`. On narrow viewports where leftover
  < 805, the column simply fills the leftover (no gaps), i.e. degrades to today's
  behavior.
- **Nested `<main>` cleanup:** Home / Basic / Settings currently render their own
  `<main>` inside AppShell's `<main>` (a pre-existing duplicate-landmark issue).
  Converting their root to `ContentColumn` (a `<div>`) removes the duplication;
  AppShell's `<main>` remains the single main landmark.
- **Home hero:** currently `width: min(100%, 760px)`; will be changed to fill the
  805 column so it doesn't sit visually inset-left within the column.
- **`box-sizing`:** already `border-box` globally, so `maxWidth: 805px` is the
  column's outer box including its padding.

## Validation

- `pnpm lint` (tsc + oxlint + format + component-count rule).
- `pnpm test:ci` — expect possible fallout in `TopicPage`, `ReviewCardPageOverview`,
  and `App` tests if they assert on structure or the `main` role; fix as needed.
- Manual browser pass across: `/`, `/flagged`, `/settings`, `/library/$topicId`,
  `/review/due`, `/review-cards/$id` (overview + reviews) at a wide viewport, to
  confirm the column caps at 805 and centers while sidebars stay put.

## Risks

- **Test coupling to markup:** wrapping content in an extra element or removing a
  `<main>` may break structural queries. Low effort to fix.
- **Scroll region assumptions:** we preserve each region's existing scroll owner;
  no intentional change, but worth a visual check on long content.

## Rollback

Isolated to a new component + one token + thin per-page wraps. Reverting the
branch fully removes the constraint.
