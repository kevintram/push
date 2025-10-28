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

    topics: list["TopicsBase"]


class TodoRead(TodoWithTopics):
    model_config = ConfigDict(from_attributes=True)
    id: int
    inserted_at: datetime
    updated_at: datetime
    user_id: str


class TodoCreate(TodoWithTopics):
    model_config = ConfigDict(from_attributes=True)


class TodoUpdate(TodoWithTopics):
    model_config = ConfigDict(from_attributes=True)
    id: int
