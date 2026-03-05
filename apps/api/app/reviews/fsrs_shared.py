"""Shared FSRS replay helpers for review mutations."""

from __future__ import annotations

from datetime import datetime, time, timezone

from fsrs import Card, Rating as FSRSRating, Scheduler, State as FSRSState

from app.models import FsrsState, Review
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
