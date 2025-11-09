from __future__ import annotations

from datetime import datetime, date

from pydantic import BaseModel, ConfigDict


class TopicBase(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    name: str
    notes: str
    stability: float | None
    difficulty: float | None
    state: str
    step: int | None
    archived: bool
    inboxed: bool
    due: date | None


class TopicBaseWithTodos(TopicBase):
    model_config = ConfigDict(from_attributes=True)

    todos: list["TodoWithTopics"]


class TopicRead(TopicBase):
    model_config = ConfigDict(from_attributes=True)

    id: int
    inserted_at: datetime
    updated_at: datetime

class TopicReadWithTodos(TopicRead):
    model_config = ConfigDict(from_attributes=True)

    todos: list["TodoRead"]

class TopicReadWithRelationships(TopicRead):
    model_config = ConfigDict(from_attributes=True)

    parents: list["TopicRead"]
    children: list["TopicRead"]

class TopicReadWithRelationshipsAndTodos(TopicRead):
    model_config = ConfigDict(from_attributes=True)

    parents: list["TopicRead"]
    children: list["TopicRead"]
    todos: list["TodoRead"]

class TopicCreate(TopicBase):
    model_config = ConfigDict(from_attributes=True)


class TopicRelationshipCreate(BaseModel):
    child_id: int


class TopicParentRelationshipCreate(BaseModel):
    parent_id: int


class TodoIdPayload(BaseModel):
    todo_id: int


class TopicUpdate(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    name: str | None = None
    notes: str | None = None
    archived: bool | None = None
    inboxed: bool | None = None
