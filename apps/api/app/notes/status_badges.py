"""Centralized status badge computation for note payloads."""

from __future__ import annotations

from datetime import date, timedelta
from typing import TYPE_CHECKING

from app.utils.current_date import get_current_date
from app.utils.retrievability import (
    FINE_THRESHOLD,
    compute_distance_to_retrievability,
)

if TYPE_CHECKING:
    from app.models.notes import Note
    from app.models.reviews import Review


def _format_calendar_date(target: date) -> str:
    return f"{target:%b} {target.day}, {target:%Y}"


def _format_due_label(days_until_due: int) -> str:
    if days_until_due == 0:
        return "Due in 0d"
    if days_until_due < 0:
        return f"Due {abs(days_until_due)}d ago"
    return f"Due in {days_until_due}d"


def _format_hazy_soon_label(days_until_hazy: int) -> str:
    return f"Hazy in {days_until_hazy}d"


def _format_hazy_for_label(days_in_tier: int) -> str:
    return f"Hazy for {days_in_tier}d"


def _format_forgotten_soon_label(days_until_forgotten: int) -> str:
    if days_until_forgotten == 0:
        return "Forgetting in 0d"
    return f"Forgetting in {days_until_forgotten}d"


def _format_forgotten_for_label(days_in_tier: int) -> str:
    return f"Forgotten for {days_in_tier}d"


def get_days_until_hazy(note: Note, *, today: date | None = None) -> int | None:
    """Calculate note-level days until entering hazy retrievability."""
    if note.stability is None or note.last_reviewed_at is None:
        return None
    days_until_hazy = compute_distance_to_retrievability(
        note.stability,
        note.last_reviewed_at,
        target_retrievability=FINE_THRESHOLD,
        current_date=today or get_current_date(),
    )
    # Avoid "0d" edge cases: a note is either at least one full day away from
    # becoming hazy, or already hazy/overdue by at least one day.
    if days_until_hazy == 0:
        if note.freshness_tier in {"Hazy", "Forgotten"}:
            return -1
        return 1
    return days_until_hazy


def get_earliest_due_review(note: Note) -> Review | None:
    """Return the earliest scheduled, incomplete review for this note."""
    due_reviews = [
        review
        for review in note.reviews
        if review.completed_at is None and review.scheduled_at is not None
    ]
    if not due_reviews:
        return None
    return min(due_reviews, key=lambda review: (review.scheduled_at, review.id))


def build_note_status_badges(
    note: Note,
    *,
    today: date | None = None,
    due_review: Review | None = None,
    days_until_due: int | None = None,
    days_until_hazy: int | None = None,
    resolve_due_badge: bool = True,
) -> list[dict[str, str | int | None]]:
    """Build stable, API-level status badges for a note."""
    current_day = today or get_current_date()
    selected_due_review = (
        due_review
        if due_review is not None
        else get_earliest_due_review(note)
        if resolve_due_badge
        else None
    )
    selected_days_until_due = days_until_due
    if selected_due_review is not None and selected_days_until_due is None:
        if selected_due_review.scheduled_at is not None:
            selected_days_until_due = (
                selected_due_review.scheduled_at - current_day
            ).days

    selected_days_until_hazy = (
        get_days_until_hazy(note, today=current_day)
        if days_until_hazy is None
        else days_until_hazy
    )

    badges: list[dict[str, str | int | None]] = []

    if selected_due_review is not None and selected_days_until_due is not None:
        due_date = current_day + timedelta(days=selected_days_until_due)
        tone = (
            "danger"
            if selected_days_until_due < 0
            else "info"
            if selected_days_until_due == 0
            else "neutral"
        )
        badges.append(
            {
                "key": "due",
                "label": _format_due_label(selected_days_until_due),
                "tooltip": _format_calendar_date(due_date),
                "tone": tone,
                "review_id": selected_due_review.id,
            }
        )

    if selected_days_until_hazy is not None and 1 <= selected_days_until_hazy <= 7:
        hazy_date = current_day + timedelta(days=selected_days_until_hazy)
        badges.append(
            {
                "key": "hazy_soon",
                "label": _format_hazy_soon_label(selected_days_until_hazy),
                "tooltip": _format_calendar_date(hazy_date),
                "tone": "warning",
                "review_id": None,
            }
        )

    if (
        note.freshness_tier == "Hazy"
        and note.days_until_next_tier is not None
        and 0 <= note.days_until_next_tier <= 7
    ):
        forgotten_date = current_day + timedelta(days=note.days_until_next_tier)
        badges.append(
            {
                "key": "forgotten_soon",
                "label": _format_forgotten_soon_label(note.days_until_next_tier),
                "tooltip": _format_calendar_date(forgotten_date),
                "tone": "danger",
                "review_id": None,
            }
        )

    if note.freshness_tier == "Hazy" and note.days_in_current_tier is not None:
        days_in_hazy_tier = max(1, note.days_in_current_tier)
        badges.append(
            {
                "key": "hazy_for",
                "label": _format_hazy_for_label(days_in_hazy_tier),
                "tooltip": None,
                "tone": "warning",
                "review_id": None,
            }
        )

    if note.freshness_tier == "Forgotten" and note.days_in_current_tier is not None:
        days_in_forgotten_tier = max(1, note.days_in_current_tier)
        badges.append(
            {
                "key": "forgotten_for",
                "label": _format_forgotten_for_label(days_in_forgotten_tier),
                "tooltip": None,
                "tone": "danger",
                "review_id": None,
            }
        )

    return badges
