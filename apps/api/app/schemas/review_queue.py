from datetime import date
from typing import Literal

from pydantic import BaseModel, ConfigDict

from app.schemas.practices import PracticeSummaryRead
from app.schemas.sources import SourceSummaryRead
from app.schemas.topics import TopicSummaryRead


class ReviewQueueItem(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    queue_type: Literal["due", "hazy"]
    entity_type: Literal["topic", "source", "practice"]
    topic: TopicSummaryRead | None = None
    source: SourceSummaryRead | None = None
    practice: PracticeSummaryRead | None = None
    review_id: int | None = None
    scheduled_at: date | None = None
    days_until_due: int | None = None
    days_until_hazy: int | None = None
