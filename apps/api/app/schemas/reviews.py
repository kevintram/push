from __future__ import annotations

from datetime import date, datetime
from typing import TYPE_CHECKING

from pydantic import BaseModel, ConfigDict

# Forward reference string for TopicRead to avoid circular imports if possible,
# but if we need it, we import it. `reviews.py` imports TopicRead.
if TYPE_CHECKING:
    from app.schemas.topic_reviews import TopicReviewWithTopic
    from app.schemas.topics import TopicRead


class ReviewBase(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    scheduled_at: date | None = None
    completed_at: date | None = None
    description: str
    notes: str


class ReviewWithTopics(ReviewBase):
    model_config = ConfigDict(from_attributes=True)

    topics: list["TopicRead"]


class ReviewRead(ReviewBase):
    model_config = ConfigDict(from_attributes=True)

    id: int
    inserted_at: datetime
    updated_at: datetime
    effective_date: date | None = None


class ReviewReadWithTopics(ReviewRead):
    model_config = ConfigDict(from_attributes=True)
    topics: list["TopicRead"]


class ReviewReadWithTopicReviews(ReviewRead):
    model_config = ConfigDict(from_attributes=True)
    topic_reviews: list["TopicReviewWithTopic"]


class ReviewCreate(ReviewBase):
    model_config = ConfigDict(from_attributes=True)


class ReviewUpdate(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    scheduled_at: date | None = None
    completed_at: date | None = None
    description: str | None = None
    notes: str | None = None


class TopicIdPayload(BaseModel):
    topic_id: int
