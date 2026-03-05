from datetime import datetime
from typing import Literal

from pydantic import BaseModel, ConfigDict

from app.schemas.review_cards import ReviewCardRead
from app.schemas.topics import TopicRead


class SearchResultItem(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    entity_type: Literal["topic", "review_card"]
    topic: TopicRead | None = None
    review_card: ReviewCardRead | None = None
    recent_activity_at: datetime
