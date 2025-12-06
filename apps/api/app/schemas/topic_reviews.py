from __future__ import annotations

from datetime import datetime, date
from typing import TYPE_CHECKING

from pydantic import BaseModel, ConfigDict, model_validator

if TYPE_CHECKING:
    from app.schemas.topics import TopicRead, TopicCreate
    from app.schemas.reviews import ReviewCreate


class TopicReviewBase(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    rating: str | None


class TopicReviewRead(TopicReviewBase):
    model_config = ConfigDict(from_attributes=True)

    id: int
    review_id: int
    topic_id: int
    inserted_at: datetime
    updated_at: datetime

    # Topic FSRS state before review
    stability_before: float | None
    difficulty_before: float | None
    state_before: str | None
    step_before: int | None
    due_before: date | None

    # Topic FSRS state after review
    stability_after: float | None
    difficulty_after: float | None
    state_after: str | None
    step_after: int | None
    due_after: date | None


class TopicReviewWithTopic(TopicReviewRead):
    model_config = ConfigDict(from_attributes=True)

    topic: "TopicRead"


class TopicReviewCreate(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    # Mutually exclusive: provide topic_id OR topic (not both)
    topic_id: int | None = None
    topic: "TopicCreate | None" = None

    # Mutually exclusive: provide review_id OR review (not both)
    review_id: int | None = None
    review: "ReviewCreate | None" = None

    rating: str | None = None

    @model_validator(mode="after")
    def validate_mutually_exclusive_fields(self) -> "TopicReviewCreate":
        # Validate topic fields
        if self.topic_id is not None and self.topic is not None:
            raise ValueError("Cannot provide both topic_id and topic")
        if self.topic_id is None and self.topic is None:
            raise ValueError("Must provide either topic_id or topic")

        # Validate review fields
        if self.review_id is not None and self.review is not None:
            raise ValueError("Cannot provide both review_id and review")
        if self.review_id is None and self.review is None:
            raise ValueError("Must provide either review_id or review")

        return self


class TopicReviewUpdate(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    rating: str | None
