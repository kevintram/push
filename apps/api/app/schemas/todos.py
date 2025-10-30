from __future__ import annotations

from datetime import date, datetime

from pydantic import BaseModel, ConfigDict


class TodoBase(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    scheduled_at: date | None = None
    completed_at: date | None = None
    description: str


class TodoWithTopics(TodoBase):
    model_config = ConfigDict(from_attributes=True)

    topics: list["TopicRead"]

class TodoRead(TodoBase):
    model_config = ConfigDict(from_attributes=True)

    id: int
    inserted_at: datetime
    updated_at: datetime
    effective_date: date | None = None

class TodoReadWithTopics(TodoRead):
    model_config = ConfigDict(from_attributes=True)
    topics: list["TopicRead"]

class TodoCreate(TodoBase):
    model_config = ConfigDict(from_attributes=True)


class TodoUpdate(TodoBase):
    model_config = ConfigDict(from_attributes=True)
    id: int


class TopicIdPayload(BaseModel):
    topic_id: int
