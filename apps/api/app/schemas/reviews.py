from __future__ import annotations

from datetime import datetime, date

from pydantic import BaseModel, ConfigDict

from app.schemas.topics import TopicRead


class ReviewBase(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    rating: str


class ReviewRead(ReviewBase):
    model_config = ConfigDict(from_attributes=True)

    id: int
    todo_id: int
    topic_id: int
    inserted_at: datetime
    updated_at: datetime

    # Topic FSRS state before review
    topic_stability_before: float | None
    topic_difficulty_before: float | None
    topic_state_before: str | None
    topic_step_before: int | None

    # Topic FSRS state after review
    topic_stability_after: float | None
    topic_difficulty_after: float | None
    topic_state_after: str | None
    topic_step_after: int | None
    topic_due_after: date | None


class ReviewWithTopic(ReviewRead):
    model_config = ConfigDict(from_attributes=True)

    topic: TopicRead


class ReviewCreate(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    todo_id: int
    topic_id: int
    rating: str


class ReviewUpdate(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    rating: str
