from __future__ import annotations

from datetime import date, datetime
from enum import Enum
from typing import TYPE_CHECKING

from pydantic import BaseModel, ConfigDict, model_validator

from app.schemas.entity_relations import RelatedEntityRead

if TYPE_CHECKING:
    from app.schemas.practices import PracticeSummaryRead
    from app.schemas.practices import PracticeCreate
    from app.schemas.sources import SourceCreate
    from app.schemas.sources import SourceSummaryRead


class FreshnessTier(str, Enum):
    FRESH = "Fresh"
    FINE = "Fine"
    HAZY = "Hazy"
    FORGOTTEN = "Forgotten"


class TopicBase(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    name: str = ""
    notes: str = ""
    archived: bool = False
    inboxed: bool = False


class TopicRead(TopicBase):
    """Topic read schema with FSRS fields flattened from fsrs_state relationship."""

    model_config = ConfigDict(from_attributes=True)

    id: int
    parent_id: int | None = None
    fsrs_state_id: int | None = None
    inserted_at: datetime
    updated_at: datetime
    recent_activity_at: datetime | None = None

    # FSRS fields (from joined fsrs_state via properties on Topic model)
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
    days_in_current_tier: int | None = None


class TopicSummaryRead(TopicRead):
    """Topic with relationship counts for list views."""

    model_config = ConfigDict(from_attributes=True)

    parent: TopicRead | None = None
    children_count: int = 0
    sources_count: int = 0
    practices_count: int = 0
    related_outgoing_count: int = 0
    related_incoming_count: int = 0


class TopicDetailRead(TopicSummaryRead):
    """Topic with full relationships loaded for detail views."""

    model_config = ConfigDict(from_attributes=True)

    parent: TopicSummaryRead | None = None
    children: list[TopicSummaryRead] = []
    related_outgoing: list[RelatedEntityRead] = []
    related_incoming: list[RelatedEntityRead] = []
    sources: list[SourceSummaryRead] = []
    practices: list[PracticeSummaryRead] = []


class RelationshipDirection(str, Enum):
    OUTGOING = "outgoing"
    INCOMING = "incoming"


class TopicRelatedRead(TopicRead):
    """Topic with relationship direction for related topics."""

    model_config = ConfigDict(from_attributes=True)

    relationship_direction: RelationshipDirection


class TopicCreate(BaseModel):
    """Create a new topic."""

    model_config = ConfigDict(from_attributes=True)

    name: str = ""
    notes: str = ""
    archived: bool = False
    inboxed: bool = False
    parent_id: int | None = None
    srs_enabled: bool = False
    inherit_fsrs: bool = False  # If true and parent_id set, copy parent's FSRS state


class TopicChildAdd(BaseModel):
    """Add an existing topic as a child."""

    child_id: int


class TopicChildRelationshipCreate(BaseModel):
    """Create a child relationship - supports both existing and inline creation."""

    # Mutually exclusive: provide child_id OR child (not both)
    child_id: int | None = None
    child: TopicCreate | None = None

    @model_validator(mode="after")
    def validate_mutually_exclusive_fields(self) -> "TopicChildRelationshipCreate":
        if self.child_id is not None and self.child is not None:
            raise ValueError("Cannot provide both child_id and child")
        if self.child_id is None and self.child is None:
            raise ValueError("Must provide either child_id or child")
        return self


class TopicParentRelationshipCreate(BaseModel):
    """Create a parent relationship - supports both existing and inline creation."""

    # Mutually exclusive: provide parent_id OR parent (not both)
    parent_id: int | None = None
    parent: TopicCreate | None = None

    @model_validator(mode="after")
    def validate_mutually_exclusive_fields(self) -> "TopicParentRelationshipCreate":
        if self.parent_id is not None and self.parent is not None:
            raise ValueError("Cannot provide both parent_id and parent")
        if self.parent_id is None and self.parent is None:
            raise ValueError("Must provide either parent_id or parent")
        return self


class ReviewIdPayload(BaseModel):
    review_id: int


class TopicRelationshipResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    parent: TopicDetailRead
    child: TopicDetailRead


class TopicUpdate(BaseModel):
    """Update an existing topic."""

    model_config = ConfigDict(from_attributes=True)

    name: str | None = None
    notes: str | None = None
    archived: bool | None = None
    inboxed: bool | None = None
    parent_id: int | None = None  # Explicit null clears parent
    srs_enabled: bool | None = None


class TopicOtherRelationshipCreate(BaseModel):
    """Create a related topic relationship."""

    # Mutually exclusive: provide to_topic_id OR to_topic (not both)
    to_topic_id: int | None = None
    to_topic: TopicCreate | None = None

    @model_validator(mode="after")
    def validate_mutually_exclusive_fields(self) -> "TopicOtherRelationshipCreate":
        if self.to_topic_id is not None and self.to_topic is not None:
            raise ValueError("Cannot provide both to_topic_id and to_topic")
        if self.to_topic_id is None and self.to_topic is None:
            raise ValueError("Must provide either to_topic_id or to_topic")
        return self


class TopicOtherRelationshipResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    from_topic: TopicRead
    to_topic: TopicRead


class TopicPracticeAdd(BaseModel):
    """Add a practice to this topic."""

    practice_id: int | None = None
    practice: PracticeCreate | None = None

    @model_validator(mode="after")
    def validate_mutually_exclusive_fields(self) -> "TopicPracticeAdd":
        if self.practice_id is not None and self.practice is not None:
            raise ValueError("Cannot provide both practice_id and practice")
        if self.practice_id is None and self.practice is None:
            raise ValueError("Must provide either practice_id or practice")
        return self


class TopicSourceAdd(BaseModel):
    """Add a source covering this topic."""

    source_id: int | None = None
    source: SourceCreate | None = None

    @model_validator(mode="after")
    def validate_mutually_exclusive_fields(self) -> "TopicSourceAdd":
        if self.source_id is not None and self.source is not None:
            raise ValueError("Cannot provide both source_id and source")
        if self.source_id is None and self.source is None:
            raise ValueError("Must provide either source_id or source")
        return self


class ConvertToSourceResponse(BaseModel):
    """Response from converting a topic to a source."""

    source_id: int


class ConvertToPracticeResponse(BaseModel):
    """Response from converting a topic to a practice."""

    practice_id: int
