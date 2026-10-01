# Icon-only application sidebar

Status: implemented, including the persisted expand/collapse toggle.

## Outcome

Replace the currently rendered 240px application sidebar with a narrow,
icon-only navigation rail. `AppShell` switches between the rail and the
existing expanded sidebar, remembers the preference in `localStorage`, and
starts collapsed when no preference has been saved.

The rail provides direct access to the existing Review queues, Hide Mode,
Search, and Settings. The expanded presentation includes Library and
collections; Library does not appear in the collapsed rail.

## Agreed rail order

From top to bottom:

1. Expand sidebar toggle
2. Hide Mode
3. Search
4. Due
5. New
6. Late
7. Flagged
8. Flexible spacer
9. Settings

Hide Mode appears immediately above Search. Settings remains pinned to the
bottom of the application frame.

## Scope

### Included

- Add a narrow icon-only rail and render it in the application shell.
- Keep the expanded sidebar implementation in a separately named component.
- Use `PanelLeftOpen` and `PanelLeftClose` for the expand and collapse controls.
- Persist expanded state in `localStorage`; default to collapsed without a
  saved preference.
- Render only one sidebar presentation at a time and restore focus to its
  toggle after switching.
- Render direct icon links for Due, New, Late, Flagged, and Settings.
- Reuse the existing Hide Mode and Search icon controls.
- Show right-side tooltips for controls and navigation links whose meaning is
  no longer expressed by visible text.
- Preserve active-route styling for Review links and Settings.
- Preserve Review queue availability indicators in a compact form.
- Preserve the current Hide Mode visual themes across the rail and its items.
- Add focused component and shell tests for the new presentation.

### Excluded

- Do not render a Library icon, collection tree, collection flyout, or Library
  actions in the rail.
- Do not add a keyboard shortcut for the sidebar.
- Do not change Review queries, routes, Hide Mode behavior, Search behavior, or
  Settings behavior.
- Do not add responsive drawer behavior.
- Do not remove or redesign the existing expanded sidebar implementation.

## Component structure

Use explicit presentation components rather than adding `collapsed`
conditionals throughout the existing Review and Library navigation trees.

```text
src/app/layout/
  AppShell.tsx
  CollapsedAppSidebar.tsx
  ExpandedAppSidebar.tsx
  SidebarRailReviewLink.tsx
  __tests__/
    AppShell.test.tsx
    CollapsedAppSidebar.test.tsx
```

Responsibilities:

| Component | Responsibility |
| --- | --- |
| `AppShell` | Own the persisted expanded state, switch between presentations, and restore focus after a switch. |
| `CollapsedAppSidebar` | Render the icon-only rail, its ordering, spacing, themes, and footer placement. |
| `ExpandedAppSidebar` | Preserve the current branded sidebar, Review section, Library tree, and footer for the future expanded state. |
| `SidebarRailReviewLink` | Render one accessible Review route icon, tooltip, active state, and optional availability indicator. |

`ExpandedAppSidebar` should be produced by moving the current `CollapsedAppSidebar`
implementation with minimal behavioral change. It remains exported and
typechecked even though the shell does not render it yet.

If the Review link abstraction can remain small and clear inside
`CollapsedAppSidebar.tsx` without violating the one-component-per-file rule, prefer the
separate component shown above. Do not generalize it into a broad navigation
framework.

## Rail presentation

- Use an approximately 48px-wide rail with consistent 36px toggle and
  navigation hit areas around 16px glyphs.
- Keep the rail full-height and nonshrinking.
- Center every control on one shared vertical axis.
- Use consistent square hit areas for rail navigation items.
- Retain the existing app chrome background and Hide Mode theme overrides.
- Separate the top utility controls from the Review links with spacing rather
  than a labeled section header.
- Use a flex-growing spacer to pin Settings to the bottom.
- Do not display the `3gulp` wordmark in the rail.
- Use StyleX for all new styles, defined inline with their owning components.
- Continue using shared spacing, icon-size, radius, and color tokens.

The rail control is named `Expand sidebar`; the expanded control is named
`Collapse sidebar`. Both expose `aria-expanded` and `aria-controls` for the
stable `app-sidebar` navigation region.

## Navigation and active states

Render these direct links with their existing icons:

| Destination | Icon | Accessible label / tooltip |
| --- | --- | --- |
| `/review/due` | `Calendar` | Due |
| `/review/new` | `Sparkles` | New |
| `/review/late` | `BellRing` | Late |
| `/review/flagged` | `Flag` | Flagged |
| `/settings` | `Settings` | Settings |

Use TanStack Router `Link` composition so the existing `data-status=active`
styling continues to identify the current route. Settings retains exact-match
behavior. Each icon is decorative because the link receives its accessible
name from `aria-label`.

All icon-only navigation items receive a right-side tooltip. Reuse the existing
application-level `TooltipProvider`; do not add another provider in the rail.

## Review availability indicators

Continue subscribing to the same Review data used by `ReviewNavigation`:

- Due entries for today
- New entries
- Late entries for today
- Flagged cards

When a queue contains cards, show the existing `StatusDot` as a small overlay
on the corresponding icon item. Preserve the enhanced accessible names such as
`Due, cards available` while keeping the tooltip label concise (`Due`).

Keep query behavior nonblocking and preserve the existing handling in which
missing or errored data simply results in no availability dot. Query
optimization remains outside this change.

## Existing controls

### Hide Mode

Reuse `HideModeButton` so its pressed state, tooltip, hotkey hint, colors, and
behavior remain unchanged. Place it above Search.

### Search

Reuse `SearchDialog` so its tooltip, hotkey hint, dialog state, and behavior
remain unchanged.

### Sidebar control

- Render the enabled `Expand sidebar` control first in the rail.
- Render an enabled `Collapse sidebar` control in the expanded header.
- Keep `aria-expanded` and `aria-controls='app-sidebar'` in sync with the
  current presentation.
- Return keyboard focus to the corresponding replacement control after each
  switch.

## Accessibility

- The rail remains a `nav` landmark with `aria-label='primary'`.
- Every icon-only link or button has an accessible name.
- Decorative SVGs use `aria-hidden='true'`.
- Tooltips supplement, but do not provide, accessible names.
- Expanded/collapsed state is communicated through `aria-expanded`.
- Active route semantics continue to come from TanStack Router links.
- Availability dots do not become independent focus targets.
- Keyboard tab order follows the visual top-to-bottom order.

## Testing

Add focused tests that verify behavior rather than generated StyleX classes.

### `CollapsedAppSidebar` tests

- Renders a primary navigation landmark.
- Renders the enabled `Expand sidebar` control first.
- Places Hide Mode before Search in DOM/tab order.
- Renders Due, New, Late, Flagged, and Settings links with correct destinations.
- Does not render Library or Library collections.
- Applies the existing enhanced accessible label when a Review queue has cards.
- Does not show an availability indicator for an empty queue.
- Keeps Settings as an exact-match link.
- Exposes tooltip content for the icon-only navigation links.

Use the existing Query Client and Convex test utilities or mock the same query
boundaries used by `ReviewNavigation`, following its current tests.

### Shell tests

- Update the existing sidebar mock only as needed for the renamed/preserved
  expanded component.
- Keep the existing Hide Mode shell-theme test passing.
- Confirm the shell renders the rail presentation, not the expanded sidebar.

### Regression tests

- Keep `SidebarItem.Icon` tests passing.
- Keep `HideModeButton` and `SearchDialog` tests passing.
- Keep existing expanded Review and Library navigation tests passing after the
  component move; their behavior is intentionally preserved for the future
  expanded state.

## Validation

1. Run targeted tests for `CollapsedAppSidebar`, `AppShell`, `SidebarItem`,
   `HideModeButton`, and `SearchDialog`.
2. Run `pnpm lint`.
3. Run `pnpm test:ci`.
4. Run `pnpm build`.
5. Start Web V2 with `./run.sh` and validate through an authenticated browser
   session using the repository test account.
6. At normal and short desktop viewport heights, verify:
   - the rail remains full-height;
   - Settings stays at the bottom;
   - Hide Mode is above Search;
   - all controls align on one vertical axis;
   - tooltips open to the right and do not obscure the rail;
   - active and hover states remain legible in regular and Hide Mode themes;
   - availability dots do not collide with glyphs or focus indicators;
   - main content receives the width reclaimed from the expanded sidebar.
7. Clean up the dedicated browser session after validation.

## Follow-up

The basic toggle is implemented. Collapsing unmounts the expanded sidebar, so
open Library branches reset when it is expanded again; selected collection
ancestors continue to be restored by the Library navigation. A keyboard
shortcut and a Library entry point in the rail remain separate product
decisions.

## Acceptance criteria

- The rendered application sidebar is an icon-only rail.
- The visible order is sidebar control, Hide Mode, Search, Due, New, Late,
  Flagged, then Settings at the bottom.
- No Library UI appears in the rail.
- Review and Settings navigation works and shows active states.
- Review availability remains visible and accessible.
- All icon-only items are keyboard accessible and named independently of their
  tooltips.
- The rail and expanded sidebar switch through the enabled controls, with one
  presentation mounted at a time.
- The preference persists in `localStorage`, and focus follows the control
  after switching.
- The expanded sidebar remains a separate component with its Library tree.
- Validation and authenticated visual checks pass without changing unrelated
  application behavior.
