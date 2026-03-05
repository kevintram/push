"""Review business logic and FSRS replay (review-card centric)."""

from datetime import date
from typing import Literal

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from app.exceptions import BadRequestError, NotFoundError
from app.models import Review, ReviewCard
from app.reviews.fsrs_shared import update_fsrs


async def _get_review_card(
    session: AsyncSession, review_card_id: int, user_id: str
) -> ReviewCard:
    result = await session.execute(
        select(ReviewCard)
        .where(ReviewCard.id == review_card_id, ReviewCard.user_id == user_id)
        .options(
            selectinload(ReviewCard.topic),
            selectinload(ReviewCard.reviews),
        )
    )
    review_card = result.scalar_one_or_none()
    if not review_card:
        raise NotFoundError("Review card", review_card_id)
    return review_card


async def update_entity_fsrs(
    session: AsyncSession,
    review_card: ReviewCard,
    starting_from: date,
) -> None:
    reviews_result = await session.execute(
        select(Review)
        .where(
            Review.review_card_id == review_card.id,
            Review.user_id == review_card.user_id,
            Review.completed_at.isnot(None),
            Review.completed_at >= starting_from,
        )
        .order_by(Review.completed_at.asc())
    )
    reviews_to_replay = list(reviews_result.scalars().all())

    before_result = await session.execute(
        select(Review)
        .where(
            Review.review_card_id == review_card.id,
            Review.user_id == review_card.user_id,
            Review.completed_at.isnot(None),
            Review.completed_at < starting_from,
        )
        .order_by(Review.completed_at.desc())
        .limit(1)
    )
    last_before = before_result.scalar_one_or_none()

    update_fsrs(review_card, reviews_to_replay, last_before)
    if reviews_to_replay:
        review_card.last_reviewed_at = reviews_to_replay[-1].completed_at
    elif last_before is not None:
        review_card.last_reviewed_at = last_before.completed_at
    else:
        review_card.last_reviewed_at = review_card.inherited_last_review


async def _reload_review(session: AsyncSession, review_id: int, user_id: str) -> Review:
    result = await session.execute(
        select(Review)
        .where(Review.id == review_id, Review.user_id == user_id)
        .options(
            selectinload(Review.review_card).selectinload(ReviewCard.topic),
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
    review_card_id: int | None = None,
    effective_date_before: date | None = None,
    effective_date_after: date | None = None,
    completed: bool | None = None,
    scheduled: bool | None = None,
    order: Literal["asc", "desc"] = "asc",
) -> list[Review]:
    stmt = (
        select(Review)
        .where(Review.user_id == user_id)
        .options(
            selectinload(Review.review_card).selectinload(ReviewCard.topic),
        )
    )

    if review_card_id is not None:
        stmt = stmt.where(Review.review_card_id == review_card_id)

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
    return list(result.scalars().all())


async def create_review(
    session: AsyncSession,
    user_id: str,
    *,
    review_card_id: int,
    description: str | None = None,
    notes: str | None = None,
    scheduled_at: date | None = None,
    completed_at: date | None = None,
    rating: str | None = None,
) -> Review:
    review_card = await _get_review_card(session, review_card_id, user_id)

    new_review = Review(
        user_id=user_id,
        review_card_id=review_card.id,
        description=description or "",
        notes=notes or "",
        scheduled_at=scheduled_at,
        completed_at=completed_at,
        rating=(rating or "good") if completed_at is not None else None,
    )
    session.add(new_review)
    await session.flush()

    if completed_at is not None:
        await update_entity_fsrs(session, review_card, completed_at)
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
    review_card_id: int | None = None,
    fields_set: set[str],
) -> Review:
    review = await get_review(session, review_id, user_id)
    old_completed_at = review.completed_at
    old_card = review.review_card

    if "description" in fields_set and description is not None:
        review.description = description
    if "notes" in fields_set and notes is not None:
        review.notes = notes
    if "scheduled_at" in fields_set:
        review.scheduled_at = scheduled_at

    card_changed = False
    new_card = old_card

    if "review_card_id" in fields_set:
        if review_card_id is None:
            raise BadRequestError("Review must remain linked to a review card")
        new_card = await _get_review_card(session, review_card_id, user_id)
        review.review_card_id = new_card.id
        card_changed = old_card is None or old_card.id != new_card.id

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
        if old_completed_at is not None and old_card is not None:
            await update_entity_fsrs(session, old_card, old_completed_at)
    elif card_changed:
        if old_card is not None and old_completed_at is not None:
            await update_entity_fsrs(session, old_card, old_completed_at)

        if new_card is not None:
            await update_entity_fsrs(session, new_card, new_completed_at)
    elif new_card is not None:
        await update_entity_fsrs(session, new_card, new_completed_at)

    await session.flush()
    return await _reload_review(session, review.id, user_id)


async def delete_review(
    session: AsyncSession,
    review_id: int,
    user_id: str,
) -> None:
    review = await get_review(session, review_id, user_id)
    review_card = review.review_card
    completed_at = review.completed_at

    await session.delete(review)
    await session.flush()

    if completed_at is not None and review_card is not None:
        await update_entity_fsrs(session, review_card, completed_at)
        await session.flush()
