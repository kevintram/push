from __future__ import annotations

from datetime import datetime, date

from pydantic import BaseModel, ConfigDict, model_validator

from app.schemas.entity_relations import RelatedEntityRead
from app.schemas.topics import RetrievabilityBucket, TopicSummaryRead


class SourceBase(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    title: str = ""
    notes: str = ""
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

    # FSRS fields (from joined fsrs_state via properties on Source model)
    stability: float | None = None
    difficulty: float | None = None
    state: str = "LEARNING"
    step: int | None = None
    srs_enabled: bool = False
    last_reviewed_at: date | None = None

    # Inherited fields
    inherited_stability: float | None = None
    inherited_difficulty: float | None = None
    inherited_state: str | None = None
    inherited_step: int | None = None
    inherited_last_review: date | None = None

    # Computed
    retrievability: float | None = None
    bucket: RetrievabilityBucket | None = None
    days_until_threshold: int | None = None


class SourceSummaryRead(SourceRead):
    """Source with relationship counts for list views."""

    model_config = ConfigDict(from_attributes=True)

    children_count: int = 0
    topics_count: int = 0


class SourceDetailRead(SourceSummaryRead):
    """Source with full relationships loaded for detail views."""

    model_config = ConfigDict(from_attributes=True)

    parent: SourceSummaryRead | None = None
    children: list[SourceSummaryRead] = []
    topics: list[TopicSummaryRead] = []
    related_outgoing: list[RelatedEntityRead] = []
    related_incoming: list[RelatedEntityRead] = []


class SourceCreate(BaseModel):
    """Create a new source."""

    model_config = ConfigDict(from_attributes=True)

    title: str = ""
    notes: str = ""
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


class SourceRelationshipResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    parent: SourceDetailRead
    child: SourceDetailRead


class SourceUpdate(BaseModel):
    """Update an existing source."""

    model_config = ConfigDict(from_attributes=True)

    title: str | None = None
    notes: str | None = None
    archived: bool | None = None
    inboxed: bool | None = None
    parent_id: int | None = None  # Explicit null clears parent
    srs_enabled: bool | None = None


class SourceTopicAdd(BaseModel):
    """Add a topic that this source covers."""

    topic_id: int


class SourceTopicResponse(BaseModel):
    """Response when adding a topic to a source."""

    model_config = ConfigDict(from_attributes=True)

    source: SourceSummaryRead
    topic: TopicSummaryRead
