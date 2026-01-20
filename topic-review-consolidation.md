# Review Page Consolidation

## Problem

The "what should I review now?" experience is fragmented across three separate screens

1. **Today** — Shows overdue + scheduled-for-today review entries
2. **Review (Ready)** — Shows topics grouped by FSRS retrievability (Late/Ready/Early)
3. **Unscheduled** — Shows reviews with no scheduled date (backlog)

Users have two main workflows:
1. **"Do now"** — Review something right now (whatever they feel like)
2. **"Plan"** — Schedule future reviews

For the "do now" workflow, users must check three different places to decide what to do. This creates friction and cognitive overhead.

The **Upcoming** page serves the "plan" workflow well, but the other three pages all partially answer "what can I do now?"

---

## Proposed Solution

Consolidate into the **Review page** as the primary hub for "do now" mode.

### Layout

```
┌─────────────────────────────────────────────────┐
│ Review                                          │
├─────────────────────────────────────────────────┤
│ ┌─────────────────────────────────────────────┐ │
│ │ [Today] [Upcoming] [Unscheduled]    [▼]     │ │
│ │                                             │ │
│ │  Overdue (2)                                │ │
│ │  • Review entry...                          │ │
│ │  • Review entry...                          │ │
│ │  Today (3)                                  │ │
│ │  • Review entry...                          │ │
│ └─────────────────────────────────────────────┘ │
│                                                 │
│ Late                                            │
│ [topic] [topic] [topic]                         │
│                                                 │
│ Ready                                           │
│ [topic] [topic] [topic]                         │
│                                                 │
│ Early                                           │
│ [topic] [topic] [topic]                         │
└─────────────────────────────────────────────────┘
```

### Structure

| Element | Description |
|---------|-------------|
| **Schedule card** | Embedded at top of Review page. Contains tabs for Today/Upcoming/Unscheduled. Expandable/collapsible. |
| **Card tabs** | Today (Overdue + Due Today), Upcoming (scheduled future reviews), Unscheduled (backlog). Clicking switches content within the card. |
| **Topic buckets** | Current Review page content—Late/Ready/Early topics based on FSRS retrievability |

### Why This Works

- **Single entry point** for "what should I do now?"
- **Schedule card** consolidates all scheduled/planned reviews in one compact area
- **Tabs within card** keep Today/Upcoming/Unscheduled easily accessible without fragmenting the navigation
- **Topic buckets** remain the primary content, emphasizing learning science
- **Review page becomes the hub**, aligning with the app's focus on evidence-based learning

### Information Hierarchy

1. **Overdue/Today** (top) — You scheduled these, honor your commitment
2. **Late/Ready topics** (main) — FSRS says these are optimal to review
3. **Early topics** (below) — Still fresh, can wait
4. **Unscheduled** (tab) — Backlog, lowest priority
5. **Upcoming** (tab) — Planning view, not "do now"

---

## Navigation Changes

### Before

```
Sidebar:
├── Review (topic buckets)
├── Schedule
│   ├── Today
│   ├── Upcoming
│   └── Unscheduled
```

### After

```
Sidebar:
├── Review (consolidated hub)
```

Upcoming and Unscheduled are now accessible via tabs within the Schedule card on the Review page, removing them from the sidebar entirely.
