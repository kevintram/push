from __future__ import annotations

from datetime import datetime

from pydantic import BaseModel, ConfigDict

from app.schemas.topics import TopicRead


class ReviewBase(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    rating: str


class ReviewRead(ReviewBase):
    model_config = ConfigDict(from_attributes=True)

    todo_id: int
    topic_id: int
    inserted_at: datetime
    updated_at: datetime


class ReviewWithTopic(ReviewRead):
    model_config = ConfigDict(from_attributes=True)

    topic: TopicRead
