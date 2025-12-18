from __future__ import annotations

from datetime import datetime, date
from typing import TYPE_CHECKING

from pydantic import BaseModel, ConfigDict, model_validator

if TYPE_CHECKING:
    from app.schemas.topics import TopicRead, TopicCreate
    from app.schemas.review_sessions import ReviewSessionCreate


class ReviewBase(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    rating: str | None
    description: str = ""
    scheduled_at: date | None = None
    completed_at: date | None = None


class ReviewRead(ReviewBase):
    model_config = ConfigDict(from_attributes=True)

    id: int
    review_session_id: int
    topic_id: int
    inserted_at: datetime
    updated_at: datetime
    effective_date: date | None = None

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


class ReviewWithTopic(ReviewRead):
    model_config = ConfigDict(from_attributes=True)

    topic: "TopicRead"


class ReviewCreate(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    
    description: str = ""
    scheduled_at: date | None = None
    completed_at: date | None = None

    # Mutually exclusive: provide topic_id OR topic (not both)
    topic_id: int | None = None
    topic: "TopicCreate | None" = None

    # Mutually exclusive: provide review_session_id OR review_session (not both)
    review_session_id: int | None = None
    review_session: "ReviewSessionCreate | None" = None

    rating: str | None = None

    @model_validator(mode="after")
    def validate_mutually_exclusive_fields(self) -> "ReviewCreate":
        # Validate topic fields
        if self.topic_id is not None and self.topic is not None:
            raise ValueError("Cannot provide both topic_id and topic")
        if self.topic_id is None and self.topic is None:
            raise ValueError("Must provide either topic_id or topic")

        # Validate review session fields
        if self.review_session_id is not None and self.review_session is not None:
            raise ValueError("Cannot provide both review_session_id and review_session")
        if self.review_session_id is None and self.review_session is None:
            raise ValueError("Must provide either review_session_id or review_session")

        return self


class ReviewUpdate(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    rating: str | None = None
    description: str | None = None
    scheduled_at: date | None = None
    completed_at: date | None = None