from __future__ import annotations

from datetime import datetime

from pydantic import BaseModel, ConfigDict


class TopicBase(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    name: str
    notes: str
    stability: int
    retrievability: float
    archived: bool
    inboxed: bool


class TopicBaseWithTodos(TopicBase):
    model_config = ConfigDict(from_attributes=True)

    todos: list["TodoWithTopics"]


class TopicRead(TopicBase):
    model_config = ConfigDict(from_attributes=True)

    id: int
    inserted_at: datetime
    updated_at: datetime

class TopicReadWithRelationships(TopicRead):
    model_config = ConfigDict(from_attributes=True)

    parents: list["TopicRead"]
    children: list["TopicRead"]


class TopicCreate(TopicBase):
    model_config = ConfigDict(from_attributes=True)
