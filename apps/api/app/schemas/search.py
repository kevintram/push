from datetime import datetime
from typing import Literal

from pydantic import BaseModel, ConfigDict

from app.schemas.practices import PracticeSummaryRead
from app.schemas.sources import SourceSummaryRead
from app.schemas.topics import TopicSummaryRead


class SearchResultItem(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    entity_type: Literal["topic", "source", "practice"]
    topic: TopicSummaryRead | None = None
    source: SourceSummaryRead | None = None
    practice: PracticeSummaryRead | None = None
    recent_activity_at: datetime
