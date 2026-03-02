from __future__ import annotations

from datetime import date, datetime
from enum import Enum

from pydantic import BaseModel, ConfigDict


class NoteTagEnum(str, Enum):
    TOPIC = "TOPIC"
    SOURCE = "SOURCE"
    PRACTICE = "PRACTICE"


class NoteRelationTypeEnum(str, Enum):
    RELATED = "RELATED"
    PREREQUISITE = "PREREQUISITE"
    COVERS = "COVERS"
    ASSESSES = "ASSESSES"


class RelationDirectionEnum(str, Enum):
    OUTGOING = "outgoing"
    INCOMING = "incoming"


class NoteStatusBadgeKeyEnum(str, Enum):
    DUE = "due"
    HAZY_SOON = "hazy_soon"
    FORGOTTEN_SOON = "forgotten_soon"
    HAZY_FOR = "hazy_for"
    FORGOTTEN_FOR = "forgotten_for"


class NoteStatusBadgeToneEnum(str, Enum):
    DANGER = "danger"
    INFO = "info"
    NEUTRAL = "neutral"
    WARNING = "warning"


class NoteStatusBadge(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    key: NoteStatusBadgeKeyEnum
    label: str
    tooltip: str | None = None
    tone: NoteStatusBadgeToneEnum
    review_id: int | None = None


class NoteBase(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    title: str = ""
    body: str = ""
    parent_id: int | None = None
    archived: bool = False
    inboxed: bool = False


class NoteRead(NoteBase):
    model_config = ConfigDict(from_attributes=True)

    id: int
    parent_title: str | None = None
    last_review_rating: str | None = None
    fsrs_state_id: int | None = None
    inserted_at: datetime
    updated_at: datetime

    # Flattened fsrs fields from Note.fsrs_state via properties
    stability: float | None = None
    difficulty: float | None = None
    state: str = "LEARNING"
    step: int | None = None
    srs_enabled: bool = True
    last_reviewed_at: date | None = None

    # Computed
    retrievability: float | None = None
    freshness_tier: str | None = None
    days_until_next_tier: int | None = None
    days_in_current_tier: int | None = None

    tags: list[NoteTagEnum] = []
    status_badges: list[NoteStatusBadge] = []


class NoteCreate(NoteBase):
    model_config = ConfigDict(from_attributes=True)

    tags: list[NoteTagEnum] = []
    srs_enabled: bool = True


class NoteUpdate(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    title: str | None = None
    body: str | None = None
    parent_id: int | None = None
    archived: bool | None = None
    inboxed: bool | None = None
    srs_enabled: bool | None = None


class NoteTagCreate(BaseModel):
    tag: NoteTagEnum


class NoteRelationCreate(BaseModel):
    to_id: int
    relation_type: NoteRelationTypeEnum


class NoteRelationRead(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    from_id: int
    to_id: int
    relation_type: NoteRelationTypeEnum
    inserted_at: datetime
    updated_at: datetime


class NoteRelationListItem(NoteRelationRead):
    direction: RelationDirectionEnum
