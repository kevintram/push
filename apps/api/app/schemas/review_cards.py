from __future__ import annotations

from datetime import date, datetime
from enum import Enum
from typing import Literal

from pydantic import BaseModel, ConfigDict, Field

from app.schemas.status_badges import StatusBadge
from app.schemas.reviews import RatingEnum


class ReviewCardTypeEnum(str, Enum):
    PRACTICE = "practice"
    FLASHCARD = "flashcard"


class ReviewCardFilterEnum(str, Enum):
    ALL = "all"
    PRACTICE = "practice"
    FLASHCARDS = "flashcards"


class ReviewCardBase(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    topic_id: int
    type: ReviewCardTypeEnum
    primary_text: str = ""
    secondary_text: str = ""
    notes: str = ""


class ReviewCardRead(ReviewCardBase):
    model_config = ConfigDict(from_attributes=True)

    id: int
    topic_title: str
    inserted_at: datetime
    updated_at: datetime

    last_review_rating: str | None = None
    stability: float | None = None
    difficulty: float | None = None
    state: str = "LEARNING"
    step: int | None = None
    retired: bool = False
    flagged_at: datetime | None = None
    last_reviewed_at: date | None = None
    next_due_at: date | None = None
    retrievability: float | None = None
    freshness_tier: str | None = None
    days_until_next_tier: int | None = None
    days_in_current_tier: int | None = None
    is_new: bool = True
    reviews_pending_count: int = 0
    reviews_overdue_count: int = 0
    reviews_due_today_count: int = 0
    status_badges: list[StatusBadge] = Field(default_factory=list)


class ReviewCardCreate(ReviewCardBase):
    model_config = ConfigDict(from_attributes=True, extra="forbid")

    retired: bool = False


class ReviewCardUpdate(BaseModel):
    model_config = ConfigDict(from_attributes=True, extra="forbid")

    topic_id: int | None = None
    type: ReviewCardTypeEnum | None = None
    primary_text: str | None = None
    secondary_text: str | None = None
    notes: str | None = None
    retired: bool | None = None
    flagged: bool | None = None


class ReviewCardQueueItem(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    queue_type: Literal["due", "hazy", "new"]
    card: ReviewCardRead
    review_id: int | None = None
    scheduled_at: date | None = None
    action_days: int | None = None
    days_until_due: int | None = None
    days_until_hazy: int | None = None


class ReviewCardQueuePage(BaseModel):
    items: list[ReviewCardQueueItem]
    as_of: date


class ReviewCardQueueSummary(BaseModel):
    overdue_count: int
    due_today_count: int
    due_next_seven_days_count: int
    new_count: int
    as_of: date


class ReviewCardFlaggedSummary(BaseModel):
    flagged_count: int


class ReviewCardReviewCreate(BaseModel):
    model_config = ConfigDict(from_attributes=True, extra="forbid")

    rating: RatingEnum | None = None
    description: str = ""
    notes: str = ""
    scheduled_at: date | None = None
    completed_at: date | None = None
