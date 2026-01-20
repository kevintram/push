from __future__ import annotations

from datetime import datetime, date
from typing import TYPE_CHECKING

from pydantic import BaseModel, ConfigDict, model_validator

if TYPE_CHECKING:
    from app.schemas.topics import TopicRead, TopicCreate
    from app.schemas.sources import SourceRead, SourceCreate
    from app.schemas.review_sessions import ReviewSessionCreate


class ReviewBase(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    rating: str | None
    description: str = ""
    notes: str = ""
    scheduled_at: date | None = None
    completed_at: date | None = None


class ReviewRead(ReviewBase):
    """Review read schema - supports polymorphic reviews (topic or source)."""

    model_config = ConfigDict(from_attributes=True)

    id: int
    review_session_id: int | None
    # Polymorphic: one of topic_id or source_id will be set (via association tables)
    topic_id: int | None = None
    source_id: int | None = None
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


class ReviewSessionSummary(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    description: str | None = None


class TopicSummary(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    name: str
    notes: str


class SourceSummary(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    title: str
    notes: str


class ReviewListItem(ReviewRead):
    """Review list item with embedded topic or source summary."""

    model_config = ConfigDict(from_attributes=True)

    review_session: ReviewSessionSummary | None
    topic: TopicSummary | None = None
    source: SourceSummary | None = None


class ReviewWithTopic(ReviewRead):
    """Review with full topic details (for topic reviews)."""

    model_config = ConfigDict(from_attributes=True)

    topic: "TopicRead"
    review_session: ReviewSessionSummary | None


class ReviewWithSource(ReviewRead):
    """Review with full source details (for source reviews)."""

    model_config = ConfigDict(from_attributes=True)

    source: "SourceRead"
    review_session: ReviewSessionSummary | None


class ReviewCreate(BaseModel):
    """Create a new review for a topic or source (polymorphic)."""

    model_config = ConfigDict(from_attributes=True)

    description: str = ""
    scheduled_at: date | None = None
    completed_at: date | None = None

    # Polymorphic: provide exactly one of topic_id, topic, source_id, or source
    topic_id: int | None = None
    topic: "TopicCreate | None" = None
    source_id: int | None = None
    source: "SourceCreate | None" = None

    # Mutually exclusive: provide review_session_id OR review_session (not both)
    review_session_id: int | None = None
    review_session: "ReviewSessionCreate | None" = None

    rating: str | None = None

    @model_validator(mode="after")
    def validate_mutually_exclusive_fields(self) -> "ReviewCreate":
        # Validate polymorphic target (exactly one of topic_id, topic, source_id, source)
        targets = [
            self.topic_id is not None,
            self.topic is not None,
            self.source_id is not None,
            self.source is not None,
        ]
        if sum(targets) != 1:
            raise ValueError(
                "Must provide exactly one of: topic_id, topic, source_id, or source"
            )

        # Validate review session fields (both can be None - session is optional)
        if self.review_session_id is not None and self.review_session is not None:
            raise ValueError("Cannot provide both review_session_id and review_session")

        return self


class ReviewUpdate(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    rating: str | None = None
    description: str | None = None
    notes: str | None = None
    scheduled_at: date | None = None
    completed_at: date | None = None
    review_session_id: int | None = None
