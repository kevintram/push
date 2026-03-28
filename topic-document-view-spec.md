## Topic Document View

Status: Draft

### Problem

When a user clicks on a topic, they see only that topic's direct review cards. To explore related subtopics, they must click into each child individually. This creates a fragmented browsing experience — users can't get a bird's-eye view of an entire knowledge domain without repeated navigation.

### Goals

- When a user navigates to a topic, render its full subtree as a single scrollable document.
- Map the topic hierarchy to heading levels (h1–h6) so the structure is immediately legible.
- Show a sticky "On this page" table of contents on the right side for quick navigation within the document.
- Support collapsible sections so users can manage density.

### Non-Goals

- Mobile-specific ToC treatment (ignore for now).
- Changing how review cards render (reuse existing card components).
- Changing the topic navigator rail (keep as-is on the left).

### Design

#### Document layout

The clicked topic becomes the root of the document. Its subtree is flattened into a top-to-bottom page:

```
[h1] Clicked Topic
body text
[card grid]

[h2] Child Topic A
body text
[card grid]

[h3] Grandchild Topic A.1
body text
[card grid]

[h2] Child Topic B
body text
[card grid]
```

- The root topic renders as h1. Each subsequent nesting level increments the heading level.
- Cap at h6 — any topics deeper than 6 levels below the root still render as h6.
- No indentation or visual nesting beyond the heading size. The document reads flat, like a textbook chapter.
- Topics remain editable in place within the document.
- Subtopic sections include a separate **Open** action. Clicking **Open** navigates to that subtopic as the new root topic (i.e., it becomes h1 and its subtree becomes the document).
- Topics with no review cards still show their heading and body text. They act as section group labels.

#### Section content

Each topic section contains, in order:

1. **Heading** — topic title at the appropriate heading level.
2. **Body text** — topic body rendered below the heading. Omit if empty.
3. **Review cards** — masonry grid of cards, same as the current topic detail page. Includes the existing type filter (All / Practice / Flashcard). Omit the grid entirely if the topic has no cards.

Topic titles and bodies are editable inline. Review cards render with the same components and behavior as today, including study mode (guess/reveal).

#### Section ordering

Subtopics render in alphabetical order from the API, matching the existing topic navigator. Depth-first traversal: a parent's children appear immediately after the parent, before the parent's siblings.

#### Collapsibility

- Each section (heading + body + cards + nested children) is collapsible via a toggle on the heading.
- All sections are **expanded by default**.
- Collapsing a parent hides everything beneath it: body, cards, and all descendant sections.
- Collapse state is local UI state (not persisted).

#### Type filter

- A **global type filter** (All / Practice / Flashcard) appears at the top of the document and applies to all sections. Each section also has its own **per-section type filter**. The most recently clicked filter wins — clicking a per-section filter overrides the global one for that section, and clicking the global filter resets all sections back to the global selection.

#### Table of contents (right sidebar)

- A sticky "On this page" table of contents on the right side of the page.
- Lists all topic headings in the subtree, indented to reflect hierarchy.
- **Scroll spy**: the currently visible section is highlighted in the ToC as the user scrolls.
- The ToC is visually flat with the page: no containing border, card, or panel chrome.
- Clicking a ToC entry scrolls the document to that section.
- Content is topic names only (no card counts or metadata).
- **Mutable**: supports the same mutation capabilities as the topic navigator rail — drag-and-drop reparenting and right-click context menu (add subtopic, delete). Mutations are reflected in both the ToC and the navigator rail via query invalidation.

#### Interaction with existing UI

- The **topic navigator rail** (left side) remains unchanged. It handles navigation between topics; the ToC handles navigation within the current document.
- **Study mode** (guess/reveal on cards and topic bodies) works as-is — each card manages its own reveal state independently.
- The **browser tab title** shows the root topic name.
- Loading a URL with a hash fragment scrolls to that section, enabling deep linking.
- Clicking a ToC entry updates the URL hash and scrolls to that section.
- Scrolling the document does **not** update the URL hash; it only updates the ToC highlight state.
