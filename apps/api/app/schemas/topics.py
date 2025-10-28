from __future__ import annotations

from datetime import datetime

from pydantic import BaseModel, ConfigDict


class TopicBase(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    name: str
    notes: str
    stability: int
    retrievability: float
    is_archived: bool
    is_inboxed: bool


class TopicBaseWithTodos(TopicBase):
    model_config = ConfigDict(from_attributes=True)

    todos: list["TodoWithTopics"]


class TopicRead(TopicBaseWithTodos):
    model_config = ConfigDict(from_attributes=True)

    id: int
    inserted_at: datetime
    updated_at: datetime
    user_id: str


class TopicCreate(TopicBase):
    model_config = ConfigDict(from_attributes=True)
