"""Review business logic and FSRS replay (note-centric)."""

from datetime import date, datetime, time, timezone
from typing import Literal

from fsrs import Card, Rating as FSRSRating, Scheduler, State as FSRSState
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from app.exceptions import BadRequestError, NotFoundError
from app.models import FsrsState, Note, Review
from app.utils.retrievability import FINE_THRESHOLD


def map_rating_to_fsrs(rating: str) -> FSRSRating:
    mapping = {
        "miss": FSRSRating.Again,
        "hard": FSRSRating.Hard,
        "good": FSRSRating.Good,
        "easy": FSRSRating.Easy,
    }
    return mapping[rating]


def map_state_to_fsrs(state: str) -> FSRSState:
    mapping = {
        "LEARNING": FSRSState.Learning,
        "REVIEW": FSRSState.Review,
        "RELEARNING": FSRSState.Relearning,
    }
    return mapping[state]


def map_fsrs_state_to_db(state: FSRSState) -> str:
    mapping = {
        FSRSState.Learning: "LEARNING",
        FSRSState.Review: "REVIEW",
        FSRSState.Relearning: "RELEARNING",
    }
    return mapping[state]


def _card_from_review(review: Review) -> Card:
    state = map_state_to_fsrs(review.state_after or "LEARNING")
    review_date = review.completed_at
    if isinstance(review_date, datetime):
        review_datetime = review_date
    else:
        review_datetime = datetime.combine(review_date, time.min).replace(
            tzinfo=timezone.utc
        )
    return Card(
        state=state,
        stability=review.stability_after,
        difficulty=review.difficulty_after,
        step=None if state == FSRSState.Review else review.step_after,
        last_review=review_datetime,
    )


def _card_from_inherited(fsrs_state: FsrsState) -> Card:
    state_str = fsrs_state.inherited_state or "LEARNING"
    state = map_state_to_fsrs(state_str)
    last_review_dt = (
        datetime.combine(fsrs_state.inherited_last_review, time.min).replace(
            tzinfo=timezone.utc
        )
        if fsrs_state.inherited_last_review is not None
        else None
    )
    return Card(
        state=state,
        stability=fsrs_state.inherited_stability,
        difficulty=fsrs_state.inherited_difficulty,
        step=None if state == FSRSState.Review else fsrs_state.inherited_step,
        last_review=last_review_dt,
    )


def _apply_card_to_fsrs(fsrs_state: FsrsState, card: Card) -> None:
    fsrs_state.stability = card.stability
    fsrs_state.difficulty = card.difficulty
    fsrs_state.state = map_fsrs_state_to_db(card.state)
    fsrs_state.step = card.step


def update_fsrs(
    fsrs_state: FsrsState,
    reviews: list[Review],
    last_before_review: Review | None,
) -> None:
    if last_before_review and last_before_review.stability_after is not None:
        starting_card = _card_from_review(last_before_review)
    else:
        starting_card = _card_from_inherited(fsrs_state)

    if not reviews:
        _apply_card_to_fsrs(fsrs_state, starting_card)
        return

    scheduler = Scheduler(desired_retention=FINE_THRESHOLD)
    current_card = starting_card

    for review in reviews:
        review.stability_before = current_card.stability
        review.difficulty_before = current_card.difficulty
        review.state_before = map_fsrs_state_to_db(current_card.state)
        review.step_before = current_card.step
        review.due_before = (
            current_card.due.date()
            if hasattr(current_card.due, "date")
            else current_card.due
        )

        fsrs_rating = map_rating_to_fsrs(review.rating or "good")
        review_date = review.completed_at
        if isinstance(review_date, datetime):
            review_datetime = review_date
        else:
            review_datetime = datetime.combine(review_date, time.min).replace(
                tzinfo=timezone.utc
            )

        updated_card, _ = scheduler.review_card(
            card=current_card,
            rating=fsrs_rating,
            review_datetime=review_datetime,
        )

        review.stability_after = updated_card.stability
        review.difficulty_after = updated_card.difficulty
        review.state_after = map_fsrs_state_to_db(updated_card.state)
        review.step_after = updated_card.step
        review.due_after = updated_card.due.date()

        current_card = updated_card

    _apply_card_to_fsrs(fsrs_state, current_card)


async def _get_note(session: AsyncSession, note_id: int, user_id: str) -> Note:
    result = await session.execute(
        select(Note)
        .where(Note.id == note_id, Note.user_id == user_id)
        .options(selectinload(Note.fsrs_state), selectinload(Note.tag_assignments))
    )
    note = result.scalar_one_or_none()
    if not note:
        raise NotFoundError("Note", note_id)
    return note


async def ensure_entity_fsrs_state(session: AsyncSession, note: Note) -> None:
    if note.fsrs_state is not None:
        return

    fsrs_state = FsrsState(srs_enabled=True)
    session.add(fsrs_state)
    await session.flush()
    note.fsrs_state_id = fsrs_state.id
    note.fsrs_state = fsrs_state


async def update_entity_fsrs(
    session: AsyncSession,
    note: Note,
    starting_from: date,
) -> None:
    if note.fsrs_state is None:
        return

    reviews_result = await session.execute(
        select(Review)
        .where(
            Review.note_id == note.id,
            Review.user_id == note.user_id,
            Review.completed_at.isnot(None),
            Review.completed_at >= starting_from,
        )
        .order_by(Review.completed_at.asc())
    )
    reviews_to_replay = list(reviews_result.scalars().all())

    before_result = await session.execute(
        select(Review)
        .where(
            Review.note_id == note.id,
            Review.user_id == note.user_id,
            Review.completed_at.isnot(None),
            Review.completed_at < starting_from,
        )
        .order_by(Review.completed_at.desc())
        .limit(1)
    )
    last_before = before_result.scalar_one_or_none()

    update_fsrs(note.fsrs_state, reviews_to_replay, last_before)
    if reviews_to_replay:
        note.fsrs_state.last_reviewed_at = reviews_to_replay[-1].completed_at
    elif last_before is not None:
        note.fsrs_state.last_reviewed_at = last_before.completed_at
    else:
        note.fsrs_state.last_reviewed_at = note.fsrs_state.inherited_last_review


async def _reload_review(session: AsyncSession, review_id: int, user_id: str) -> Review:
    result = await session.execute(
        select(Review)
        .where(Review.id == review_id, Review.user_id == user_id)
        .options(
            selectinload(Review.note).selectinload(Note.fsrs_state),
            selectinload(Review.note).selectinload(Note.tag_assignments),
        )
    )
    review = result.scalar_one_or_none()
    if not review:
        raise NotFoundError("Review", review_id)
    return review


async def get_review(session: AsyncSession, review_id: int, user_id: str) -> Review:
    return await _reload_review(session, review_id, user_id)


async def list_reviews(
    session: AsyncSession,
    user_id: str,
    *,
    note_id: int | None = None,
    effective_date_before: date | None = None,
    effective_date_after: date | None = None,
    completed: bool | None = None,
    scheduled: bool | None = None,
    order: Literal["asc", "desc"] = "asc",
) -> list[tuple[Review, str, str]]:
    stmt = (
        select(Review, Note.title, Note.body)
        .join(Note, Review.note_id == Note.id)
        .where(Review.user_id == user_id)
    )

    if note_id is not None:
        stmt = stmt.where(Review.note_id == note_id)

    if effective_date_before is not None:
        stmt = stmt.where(Review.effective_date <= effective_date_before)
    if effective_date_after is not None:
        stmt = stmt.where(Review.effective_date >= effective_date_after)

    if completed is not None:
        stmt = (
            stmt.where(Review.completed_at.isnot(None))
            if completed
            else stmt.where(Review.completed_at.is_(None))
        )

    if scheduled is not None:
        stmt = (
            stmt.where(Review.scheduled_at.isnot(None))
            if scheduled
            else stmt.where(Review.scheduled_at.is_(None))
        )

    if order == "desc":
        stmt = stmt.order_by(
            Review.effective_date.desc().nulls_last(), Review.id.desc()
        )
    else:
        stmt = stmt.order_by(Review.effective_date.asc().nulls_first(), Review.id.asc())

    result = await session.execute(stmt)
    return result.all()


async def create_review(
    session: AsyncSession,
    user_id: str,
    *,
    note_id: int,
    description: str | None = None,
    notes: str | None = None,
    scheduled_at: date | None = None,
    completed_at: date | None = None,
    rating: str | None = None,
) -> Review:
    note = await _get_note(session, note_id, user_id)

    new_review = Review(
        user_id=user_id,
        note_id=note.id,
        description=description or "",
        notes=notes or "",
        scheduled_at=scheduled_at,
        completed_at=completed_at,
        rating=(rating or "good") if completed_at is not None else None,
    )
    session.add(new_review)
    await session.flush()

    if completed_at is not None:
        await ensure_entity_fsrs_state(session, note)
        await update_entity_fsrs(session, note, completed_at)
        await session.flush()

    return await _reload_review(session, new_review.id, user_id)


def _clear_fsrs_fields(review: Review) -> None:
    review.stability_before = None
    review.difficulty_before = None
    review.state_before = None
    review.step_before = None
    review.due_before = None
    review.stability_after = None
    review.difficulty_after = None
    review.state_after = None
    review.step_after = None
    review.due_after = None


async def update_review(
    session: AsyncSession,
    review_id: int,
    user_id: str,
    *,
    description: str | None = None,
    notes: str | None = None,
    scheduled_at: date | None = ...,  # sentinel
    completed_at: date | None = ...,  # sentinel
    rating: str | None = None,
    note_id: int | None = None,
    fields_set: set[str],
) -> Review:
    review = await get_review(session, review_id, user_id)
    old_completed_at = review.completed_at
    old_note = review.note

    if "description" in fields_set and description is not None:
        review.description = description
    if "notes" in fields_set and notes is not None:
        review.notes = notes
    if "scheduled_at" in fields_set:
        review.scheduled_at = scheduled_at

    note_changed = False
    new_note = old_note

    if "note_id" in fields_set:
        if note_id is None:
            raise BadRequestError("Review must remain linked to a note")
        new_note = await _get_note(session, note_id, user_id)
        review.note_id = new_note.id
        note_changed = old_note is None or old_note.id != new_note.id

    new_completed_at = (
        completed_at if "completed_at" in fields_set else review.completed_at
    )
    if review.completed_at != new_completed_at:
        review.completed_at = new_completed_at

    if new_completed_at is not None:
        if "rating" in fields_set:
            review.rating = rating or review.rating or "good"
        else:
            review.rating = review.rating or "good"
    elif "rating" in fields_set:
        review.rating = rating

    await session.flush()

    if new_completed_at is None:
        _clear_fsrs_fields(review)
        if old_completed_at is not None and old_note is not None:
            await update_entity_fsrs(session, old_note, old_completed_at)
    elif note_changed:
        if old_note is not None and old_completed_at is not None:
            await update_entity_fsrs(session, old_note, old_completed_at)

        if new_note is not None:
            await ensure_entity_fsrs_state(session, new_note)
            await update_entity_fsrs(session, new_note, new_completed_at)
    elif new_note is not None:
        await ensure_entity_fsrs_state(session, new_note)
        await update_entity_fsrs(session, new_note, new_completed_at)

    await session.flush()
    return await _reload_review(session, review.id, user_id)


async def delete_review(
    session: AsyncSession,
    review_id: int,
    user_id: str,
) -> None:
    review = await get_review(session, review_id, user_id)
    note = review.note
    completed_at = review.completed_at

    await session.delete(review)
    await session.flush()

    if completed_at is not None:
        await update_entity_fsrs(session, note, completed_at)
        await session.flush()
