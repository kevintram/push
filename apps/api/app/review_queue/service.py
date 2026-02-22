"""Review queue business logic (unified due + hazy queue over notes)."""

from datetime import date

from sqlalchemy import select
from sqlalchemy.orm import selectinload

from app.database import get_session_factory
from app.models import Note, Review
from app.notes.status_badges import build_note_status_badges, get_days_until_hazy
from app.schemas.review_queue import ReviewQueueItem, ReviewQueuePage


def _sort_key(item: ReviewQueueItem) -> tuple[int, int, int]:
    if item.queue_type == "due":
        urgency = item.days_until_due if item.days_until_due is not None else 999_999
        return (urgency, 0, item.review_id or 0)
    urgency = item.days_until_hazy if item.days_until_hazy is not None else 999_999
    return (urgency, 1, item.note.id)


async def list_review_queue(
    user_id: str,
) -> ReviewQueuePage:
    """Unified review queue over notes with due reviews and hazy candidates."""
    session_factory = get_session_factory()
    as_of = date.today()
    due_note_ids_query = (
        select(Review.note_id)
        .where(
            Review.user_id == user_id,
            Review.completed_at.is_(None),
            Review.scheduled_at.isnot(None),
        )
        .distinct()
    )

    async with session_factory() as session:
        due_result = await session.execute(
            select(Review)
            .where(
                Review.user_id == user_id,
                Review.completed_at.is_(None),
                Review.scheduled_at.isnot(None),
            )
            .options(
                selectinload(Review.note).selectinload(Note.parent),
                selectinload(Review.note).selectinload(Note.fsrs_state),
                selectinload(Review.note).selectinload(Note.tag_assignments),
                selectinload(Review.note).selectinload(Note.reviews),
            )
            .order_by(Review.scheduled_at.asc(), Review.id.asc())
        )
        due_reviews = list(due_result.scalars().all())

        note_result = await session.execute(
            select(Note)
            .where(
                Note.user_id == user_id,
                Note.archived.is_(False),
                ~Note.id.in_(due_note_ids_query),
            )
            .options(
                selectinload(Note.parent),
                selectinload(Note.fsrs_state),
                selectinload(Note.tag_assignments),
                selectinload(Note.reviews),
            )
            .order_by(Note.updated_at.desc())
        )
        notes = list(note_result.scalars().unique().all())

    items: list[ReviewQueueItem] = []

    for review in due_reviews:
        if review.scheduled_at is None or review.note is None:
            continue
        note = review.note
        if note.archived:
            continue
        if not note.srs_enabled:
            continue

        days_until_due = (review.scheduled_at - as_of).days
        items.append(
            ReviewQueueItem(
                queue_type="due",
                entity_type="note",
                note=note,
                review_id=review.id,
                scheduled_at=review.scheduled_at,
                days_until_due=days_until_due,
                days_until_hazy=get_days_until_hazy(note, today=as_of),
                status_badges=build_note_status_badges(
                    note,
                    today=as_of,
                    due_review=review,
                    days_until_due=days_until_due,
                ),
            )
        )

    for note in notes:
        if not note.srs_enabled:
            continue
        if note.retrievability is None:
            continue

        days_until_hazy = get_days_until_hazy(note, today=as_of)
        if days_until_hazy is None:
            continue

        items.append(
            ReviewQueueItem(
                queue_type="hazy",
                entity_type="note",
                note=note,
                days_until_hazy=days_until_hazy,
                status_badges=build_note_status_badges(
                    note,
                    today=as_of,
                    due_review=None,
                    days_until_due=None,
                    days_until_hazy=days_until_hazy,
                    resolve_due_badge=False,
                ),
            )
        )

    items.sort(key=_sort_key)

    return ReviewQueuePage(items=items, as_of=as_of)
