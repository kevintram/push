"""Shared FSRS replay helpers for review mutations."""

from __future__ import annotations

from datetime import date, datetime, time, timezone
from typing import Protocol

from fsrs import Card, Rating as FSRSRating, Scheduler, State as FSRSState

from app.models import Review
from app.utils.retrievability import FINE_THRESHOLD


class ReviewCardFsrsCarrier(Protocol):
    stability: float | None
    difficulty: float | None
    state: str
    step: int | None
    last_reviewed_at: date | None
    inherited_stability: float | None
    inherited_difficulty: float | None
    inherited_state: str | None
    inherited_step: int | None
    inherited_last_review: date | None


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


def _card_from_inherited(review_card: ReviewCardFsrsCarrier) -> Card:
    state_str = review_card.inherited_state or "LEARNING"
    state = map_state_to_fsrs(state_str)
    last_review_dt = (
        datetime.combine(review_card.inherited_last_review, time.min).replace(
            tzinfo=timezone.utc
        )
        if review_card.inherited_last_review is not None
        else None
    )
    return Card(
        state=state,
        stability=review_card.inherited_stability,
        difficulty=review_card.inherited_difficulty,
        step=None if state == FSRSState.Review else review_card.inherited_step,
        last_review=last_review_dt,
    )


def _apply_card_to_review_card(review_card: ReviewCardFsrsCarrier, card: Card) -> None:
    review_card.stability = card.stability
    review_card.difficulty = card.difficulty
    review_card.state = map_fsrs_state_to_db(card.state)
    review_card.step = card.step


def update_fsrs(
    review_card: ReviewCardFsrsCarrier,
    reviews: list[Review],
    last_before_review: Review | None,
) -> None:
    if last_before_review and last_before_review.stability_after is not None:
        starting_card = _card_from_review(last_before_review)
    else:
        starting_card = _card_from_inherited(review_card)

    if not reviews:
        _apply_card_to_review_card(review_card, starting_card)
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

    _apply_card_to_review_card(review_card, current_card)
