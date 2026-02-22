from datetime import datetime
from typing import Literal

from pydantic import BaseModel, ConfigDict

from app.schemas.notes import NoteRead


class SearchResultItem(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    entity_type: Literal["note"]
    note: NoteRead
    recent_activity_at: datetime
