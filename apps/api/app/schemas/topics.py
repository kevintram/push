from __future__ import annotations

from datetime import datetime, date
from typing import TYPE_CHECKING

from pydantic import BaseModel, ConfigDict

if TYPE_CHECKING:
    from app.schemas.reviews import (
        ReviewRead,
        ReviewWithTopics,
    )


class TopicBase(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    name: str
    notes: str
    stability: float | None = None
    difficulty: float | None = None
    state: str = "LEARNING"
    step: int | None = None
    archived: bool
    inboxed: bool
    due: date | None = None


class TopicBaseWithReviews(TopicBase):
    model_config = ConfigDict(from_attributes=True)

    reviews: list["ReviewWithTopics"]


class TopicRead(TopicBase):
    model_config = ConfigDict(from_attributes=True)

    id: int
    inserted_at: datetime
    updated_at: datetime


class TopicReadWithReviews(TopicRead):
    model_config = ConfigDict(from_attributes=True)

    reviews: list["ReviewRead"]


class TopicReadWithRelationships(TopicRead):
    model_config = ConfigDict(from_attributes=True)

    parents: list["TopicRead"]
    children: list["TopicRead"]


class TopicReadWithRelationshipsAndReviews(TopicRead):
    model_config = ConfigDict(from_attributes=True)

    parents: list["TopicRead"]
    children: list["TopicRead"]
    reviews: list["ReviewRead"]


class TopicCreate(TopicBase):
    model_config = ConfigDict(from_attributes=True)


class TopicRelationshipCreate(BaseModel):
    child_id: int


class TopicParentRelationshipCreate(BaseModel):
    parent_id: int


class ReviewIdPayload(BaseModel):
    review_id: int


class TopicUpdate(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    name: str | None = None
    notes: str | None = None
    archived: bool | None = None
    inboxed: bool | None = None
