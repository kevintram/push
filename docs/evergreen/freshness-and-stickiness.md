# Freshness & Stickiness: User-Facing Memory Metrics

## Motivation

FSRS exposes two core metrics — **retrievability** and **stability** — that are powerful but opaque to new users. Terms like "retrievability" are algorithm jargon, percentages like "85%" lack context, and the existing icons don't self-explain.

This spec replaces the raw FSRS metrics with two plain-language concepts: **Freshness** and **Stickiness**.

## Freshness (replaces Retrievability)

**What it represents:** How likely you are to remember something right now.

Instead of displaying a percentage, freshness maps retrievability to four categorical labels. This also replaces the existing bucket system (Early / Ready / Late), since the freshness tiers convey both memory state and review urgency.

### Tiers

| Tier   | Retrievability Range | Meaning            | Review implication    |
| ------ | -------------------- | ------------------ | --------------------- |
| Fresh     | > 95%                | Memory is vivid    | No need to review yet |
| Fine      | 85% – 95%            | Memory is solid    | Good time to review   |
| Hazy      | 75% – 85%            | Memory is fading   | Should review soon    |
| Forgotten | < 75%                | Probably forgotten | Needs re-learning     |

In detail views, the exact retrievability percentage can still be shown (labeled "Recall") for users who want precision. On cards where space is tight, only the tier label is shown.

## Stickiness (replaces Stability)

**What it represents:** How long a memory lasts between reviews. Measured in days.

Rename only — the value and unit stay the same. "15d sticky" reads as "this memory sticks for about 15 days." Reviewing makes memories stickier.

## Terminology Reference

| FSRS term      | User-facing term | Format                      |
| -------------- | ---------------- | --------------------------- |
| Retrievability | Freshness        | Fresh / Fine / Hazy / Forgotten |
| Stability      | Stickiness       | Days (e.g., "15d sticky")   |
| Bucket         | (removed)        | Replaced by freshness tiers |
