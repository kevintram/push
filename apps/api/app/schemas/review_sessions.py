from __future__ import annotations

from datetime import date, datetime
from typing import TYPE_CHECKING

from pydantic import BaseModel, ConfigDict

if TYPE_CHECKING:
    from app.schemas.reviews import ReviewListItem


class ReviewSessionBase(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    scheduled_at: date | None = None
    completed_at: date | None = None
    description: str
    notes: str


class ReviewSessionRead(ReviewSessionBase):
    model_config = ConfigDict(from_attributes=True)

    id: int
    inserted_at: datetime
    updated_at: datetime
    effective_date: date | None = None


class ReviewSessionReadWithReviews(ReviewSessionRead):
    model_config = ConfigDict(from_attributes=True)
    reviews: list["ReviewListItem"]


class ReviewSessionCreate(ReviewSessionBase):
    model_config = ConfigDict(from_attributes=True)


class ReviewSessionUpdate(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    scheduled_at: date | None = None
    completed_at: date | None = None
    description: str | None = None
    notes: str | None = None


class TopicIdPayload(BaseModel):
    topic_id: int
