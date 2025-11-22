from __future__ import annotations

from datetime import datetime, date
from typing import TYPE_CHECKING

from pydantic import BaseModel, ConfigDict

if TYPE_CHECKING:
    from app.schemas.topics import TopicRead


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

    review_id: int
    topic_id: int
    rating: str | None


class TopicReviewUpdate(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    rating: str | None
