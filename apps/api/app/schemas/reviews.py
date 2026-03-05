from __future__ import annotations

from datetime import date, datetime
from enum import Enum

from pydantic import BaseModel, ConfigDict


class RatingEnum(str, Enum):
    MISS = "miss"
    HARD = "hard"
    GOOD = "good"
    EASY = "easy"


class ReviewBase(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    rating: RatingEnum | None
    description: str = ""
    notes: str = ""
    scheduled_at: date | None = None
    completed_at: date | None = None


class ReviewRead(ReviewBase):
    model_config = ConfigDict(from_attributes=True)

    id: int
    review_card_id: int
    inserted_at: datetime
    updated_at: datetime
    effective_date: date | None = None

    # FSRS state before review
    stability_before: float | None
    difficulty_before: float | None
    state_before: str | None
    step_before: int | None
    due_before: date | None

    # FSRS state after review
    stability_after: float | None
    difficulty_after: float | None
    state_after: str | None
    step_after: int | None
    due_after: date | None


class ReviewCardSummary(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    topic_id: int
    type: str
    prompt: str
    answer: str


class ReviewListItem(ReviewRead):
    model_config = ConfigDict(from_attributes=True)

    review_card: ReviewCardSummary


class ReviewWithCard(ReviewRead):
    model_config = ConfigDict(from_attributes=True)

    review_card: ReviewCardSummary


class ReviewCreate(BaseModel):
    model_config = ConfigDict(from_attributes=True, extra="forbid")

    review_card_id: int
    description: str = ""
    notes: str = ""
    scheduled_at: date | None = None
    completed_at: date | None = None
    rating: RatingEnum | None = None


class ReviewUpdate(BaseModel):
    model_config = ConfigDict(from_attributes=True, extra="forbid")

    rating: RatingEnum | None = None
    description: str | None = None
    notes: str | None = None
    scheduled_at: date | None = None
    completed_at: date | None = None
    review_card_id: int | None = None
