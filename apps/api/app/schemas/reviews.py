from __future__ import annotations

from datetime import datetime, date
from typing import TYPE_CHECKING

from pydantic import BaseModel, ConfigDict, model_validator

if TYPE_CHECKING:
    from app.schemas.topics import TopicRead, TopicCreate
    from app.schemas.sources import SourceRead, SourceCreate
    from app.schemas.practices import PracticeRead, PracticeCreate


class ReviewBase(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    rating: str | None
    description: str = ""
    notes: str = ""
    scheduled_at: date | None = None
    completed_at: date | None = None


class ReviewRead(ReviewBase):
    """Review read schema - supports polymorphic reviews (topic, source, or practice)."""

    model_config = ConfigDict(from_attributes=True)

    id: int
    # Polymorphic: exactly one of topic_id, source_id, or practice_id will be set
    topic_id: int | None = None
    source_id: int | None = None
    practice_id: int | None = None
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


class PracticeSummary(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    prompt: str
    answer: str


class ReviewListItem(ReviewRead):
    """Review list item with embedded topic, source, or practice summary."""

    model_config = ConfigDict(from_attributes=True)

    topic: TopicSummary | None = None
    source: SourceSummary | None = None
    practice: PracticeSummary | None = None


class ReviewWithTopic(ReviewRead):
    """Review with full topic details (for topic reviews)."""

    model_config = ConfigDict(from_attributes=True)

    topic: "TopicRead"


class ReviewWithSource(ReviewRead):
    """Review with full source details (for source reviews)."""

    model_config = ConfigDict(from_attributes=True)

    source: "SourceRead"


class ReviewWithPractice(ReviewRead):
    """Review with full practice details (for practice reviews)."""

    model_config = ConfigDict(from_attributes=True)

    practice: "PracticeRead"


class ReviewCreate(BaseModel):
    """Create a new review for a topic, source, or practice (polymorphic)."""

    model_config = ConfigDict(from_attributes=True)

    description: str = ""
    scheduled_at: date | None = None
    completed_at: date | None = None

    # Polymorphic: provide exactly one entity reference
    topic_id: int | None = None
    topic: "TopicCreate | None" = None
    source_id: int | None = None
    source: "SourceCreate | None" = None
    practice_id: int | None = None
    practice: "PracticeCreate | None" = None

    rating: str | None = None

    @model_validator(mode="after")
    def validate_mutually_exclusive_fields(self) -> "ReviewCreate":
        # Validate polymorphic target (exactly one entity reference)
        targets = [
            self.topic_id is not None,
            self.topic is not None,
            self.source_id is not None,
            self.source is not None,
            self.practice_id is not None,
            self.practice is not None,
        ]
        if sum(targets) != 1:
            raise ValueError(
                "Must provide exactly one of: topic_id, topic, source_id, source, practice_id, or practice"
            )

        return self


class ReviewUpdate(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    rating: str | None = None
    description: str | None = None
    notes: str | None = None
    scheduled_at: date | None = None
    completed_at: date | None = None
