from __future__ import annotations

from datetime import datetime, date
from enum import Enum

from typing import TYPE_CHECKING

from pydantic import BaseModel, ConfigDict, model_validator

from app.schemas.entity_relations import RelatedEntityRead
from app.schemas.practices import PracticeSummaryRead
from app.schemas.topics import FreshnessTier, TopicSummaryRead

if TYPE_CHECKING:
    from app.schemas.practices import PracticeCreate
    from app.schemas.topics import TopicCreate


class SourceStatus(str, Enum):
    NEW = "NEW"
    IN_PROGRESS = "IN_PROGRESS"
    ON_HOLD = "ON_HOLD"
    DROPPED = "DROPPED"
    COMPLETED = "COMPLETED"


class SourceBase(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    title: str = ""
    notes: str = ""
    status: SourceStatus = SourceStatus.NEW
    progress_note: str = ""
    archived: bool = False
    inboxed: bool = False


class SourceRead(SourceBase):
    """Source read schema with FSRS fields flattened from fsrs_state relationship."""

    model_config = ConfigDict(from_attributes=True)

    id: int
    parent_id: int | None = None
    fsrs_state_id: int | None = None
    inserted_at: datetime
    updated_at: datetime
    recent_activity_at: datetime | None = None

    # FSRS fields (from joined fsrs_state via properties on Source model)
    stability: float | None = None
    difficulty: float | None = None
    state: str = "LEARNING"
    step: int | None = None
    srs_enabled: bool = False
    last_reviewed_at: date | None = None
    last_review_rating: str | None = None

    # Inherited fields
    inherited_stability: float | None = None
    inherited_difficulty: float | None = None
    inherited_state: str | None = None
    inherited_step: int | None = None
    inherited_last_review: date | None = None

    # Computed
    retrievability: float | None = None
    freshness_tier: FreshnessTier | None = None
    days_until_next_tier: int | None = None


class SourceSummaryRead(SourceRead):
    """Source with relationship counts for list views."""

    model_config = ConfigDict(from_attributes=True)

    parent: SourceRead | None = None
    children_count: int = 0
    topics_count: int = 0
    related_outgoing_count: int = 0
    related_incoming_count: int = 0
    prerequisites_count: int = 0
    practices_count: int = 0


class SourceDetailRead(SourceSummaryRead):
    """Source with full relationships loaded for detail views."""

    model_config = ConfigDict(from_attributes=True)

    parent: SourceSummaryRead | None = None
    children: list[SourceSummaryRead] = []
    topics: list[TopicSummaryRead] = []
    related_outgoing: list[RelatedEntityRead] = []
    related_incoming: list[RelatedEntityRead] = []
    practices: list[PracticeSummaryRead] = []


class SourceCreate(BaseModel):
    """Create a new source."""

    model_config = ConfigDict(from_attributes=True)

    title: str = ""
    notes: str = ""
    status: SourceStatus = SourceStatus.NEW
    progress_note: str = ""
    archived: bool = False
    inboxed: bool = False
    parent_id: int | None = None
    srs_enabled: bool = False
    inherit_fsrs: bool = False  # If true and parent_id set, copy parent's FSRS state


class SourceChildAdd(BaseModel):
    """Add an existing source as a child."""

    child_id: int


class SourceChildRelationshipCreate(BaseModel):
    """Create a child relationship - supports both existing and inline creation."""

    # Mutually exclusive: provide child_id OR child (not both)
    child_id: int | None = None
    child: SourceCreate | None = None

    @model_validator(mode="after")
    def validate_mutually_exclusive_fields(self) -> "SourceChildRelationshipCreate":
        if self.child_id is not None and self.child is not None:
            raise ValueError("Cannot provide both child_id and child")
        if self.child_id is None and self.child is None:
            raise ValueError("Must provide either child_id or child")
        return self


class SourceParentRelationshipCreate(BaseModel):
    """Create a parent relationship - supports both existing and inline creation."""

    parent_id: int | None = None
    parent: SourceCreate | None = None

    @model_validator(mode="after")
    def validate_mutually_exclusive_fields(self) -> "SourceParentRelationshipCreate":
        if self.parent_id is not None and self.parent is not None:
            raise ValueError("Cannot provide both parent_id and parent")
        if self.parent_id is None and self.parent is None:
            raise ValueError("Must provide either parent_id or parent")
        return self


class SourceRelationshipResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    parent: SourceDetailRead
    child: SourceDetailRead


class SourceUpdate(BaseModel):
    """Update an existing source."""

    model_config = ConfigDict(from_attributes=True)

    title: str | None = None
    notes: str | None = None
    status: SourceStatus | None = None
    progress_note: str | None = None
    archived: bool | None = None
    inboxed: bool | None = None
    parent_id: int | None = None  # Explicit null clears parent
    srs_enabled: bool | None = None


class SourceTopicAdd(BaseModel):
    """Add a topic that this source covers."""

    topic_id: int | None = None
    topic: TopicCreate | None = None

    @model_validator(mode="after")
    def validate_mutually_exclusive_fields(self) -> "SourceTopicAdd":
        if self.topic_id is not None and self.topic is not None:
            raise ValueError("Cannot provide both topic_id and topic")
        if self.topic_id is None and self.topic is None:
            raise ValueError("Must provide either topic_id or topic")
        return self


class SourceTopicResponse(BaseModel):
    """Response when adding a topic to a source."""

    model_config = ConfigDict(from_attributes=True)

    source: SourceSummaryRead
    topic: TopicSummaryRead


class SourcePracticeAdd(BaseModel):
    """Add a practice to this source."""

    practice_id: int | None = None
    practice: PracticeCreate | None = None

    @model_validator(mode="after")
    def validate_mutually_exclusive_fields(self) -> "SourcePracticeAdd":
        if self.practice_id is not None and self.practice is not None:
            raise ValueError("Cannot provide both practice_id and practice")
        if self.practice_id is None and self.practice is None:
            raise ValueError("Must provide either practice_id or practice")
        return self


class ConvertSourceToTopicResponse(BaseModel):
    """Response from converting a source to a topic."""

    topic_id: int


class ConvertSourceToPracticeResponse(BaseModel):
    """Response from converting a source to a practice."""

    practice_id: int
