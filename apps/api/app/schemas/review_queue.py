from datetime import date
from typing import Literal

from pydantic import BaseModel, ConfigDict

from app.schemas.notes import NoteRead, NoteStatusBadge


class ReviewQueueItem(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    queue_type: Literal["due", "hazy"]
    entity_type: Literal["note"]
    note: NoteRead
    review_id: int | None = None
    scheduled_at: date | None = None
    days_until_due: int | None = None
    days_until_hazy: int | None = None
    status_badges: list[NoteStatusBadge] = []


class ReviewQueuePage(BaseModel):
    items: list[ReviewQueueItem]
    next_cursor: str | None = None
    as_of: date
