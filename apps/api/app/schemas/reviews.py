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

    # FSRS state before review
    stability_before: float | None
    difficulty_before: float | None
    state_before: str | None
    step_before: int | None

    # FSRS state after review
    stability_after: float | None
    difficulty_after: float | None
    state_after: str | None
    step_after: int | None
    due_after: date | None


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
