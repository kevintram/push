from __future__ import annotations

from datetime import datetime, date
from typing import TYPE_CHECKING

from pydantic import BaseModel, ConfigDict, model_validator

from app.schemas.topics import FreshnessTier

if TYPE_CHECKING:
    from app.schemas.sources import SourceSummaryRead
    from app.schemas.topics import TopicSummaryRead


class PracticeBase(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    prompt: str = ""
    answer: str = ""
    archived: bool = False
    inboxed: bool = False


class PracticeRead(PracticeBase):
    """Practice read schema with FSRS fields flattened from fsrs_state relationship."""

    model_config = ConfigDict(from_attributes=True)

    id: int
    fsrs_state_id: int | None = None
    inserted_at: datetime
    updated_at: datetime
    recent_activity_at: datetime | None = None

    # FSRS fields (from joined fsrs_state via properties on Practice model)
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


class PracticeSummaryRead(PracticeRead):
    """Practice with relationship counts for list views."""

    model_config = ConfigDict(from_attributes=True)

    topics_count: int = 0
    sources_count: int = 0


class PracticeDetailRead(PracticeSummaryRead):
    """Practice with full relationships loaded for detail views."""

    model_config = ConfigDict(from_attributes=True)

    topics: list[TopicSummaryRead] = []
    sources: list[SourceSummaryRead] = []


class PracticeCreate(BaseModel):
    """Create a new practice."""

    model_config = ConfigDict(from_attributes=True)

    prompt: str = ""
    answer: str = ""
    archived: bool = False
    inboxed: bool = False
    srs_enabled: bool = False
    inherit_fsrs: bool = False


class PracticeUpdate(BaseModel):
    """Update an existing practice."""

    model_config = ConfigDict(from_attributes=True)

    prompt: str | None = None
    answer: str | None = None
    archived: bool | None = None
    inboxed: bool | None = None
    srs_enabled: bool | None = None


class PracticeTopicAdd(BaseModel):
    """Add a topic that this practice assesses."""

    topic_id: int | None = None
    topic: TopicCreate | None = None

    @model_validator(mode="after")
    def validate_mutually_exclusive_fields(self) -> "PracticeTopicAdd":
        if self.topic_id is not None and self.topic is not None:
            raise ValueError("Cannot provide both topic_id and topic")
        if self.topic_id is None and self.topic is None:
            raise ValueError("Must provide either topic_id or topic")
        return self


class PracticeSourceAdd(BaseModel):
    """Add a source that this practice assesses."""

    source_id: int | None = None
    source: SourceCreate | None = None

    @model_validator(mode="after")
    def validate_mutually_exclusive_fields(self) -> "PracticeSourceAdd":
        if self.source_id is not None and self.source is not None:
            raise ValueError("Cannot provide both source_id and source")
        if self.source_id is None and self.source is None:
            raise ValueError("Must provide either source_id or source")
        return self


class PracticeTopicResponse(BaseModel):
    """Response when adding a topic to a practice."""

    model_config = ConfigDict(from_attributes=True)

    practice: PracticeSummaryRead
    topic: TopicSummaryRead


class PracticeSourceResponse(BaseModel):
    """Response when adding a source to a practice."""

    model_config = ConfigDict(from_attributes=True)

    practice: PracticeSummaryRead
    source: SourceSummaryRead


class ConvertPracticeToTopicResponse(BaseModel):
    """Response from converting a practice to a topic."""

    topic_id: int


class ConvertPracticeToSourceResponse(BaseModel):
    """Response from converting a practice to a source."""

    source_id: int


# Import for forward references
from app.schemas.topics import TopicSummaryRead, TopicCreate  # noqa: E402
from app.schemas.sources import SourceSummaryRead, SourceCreate  # noqa: E402

PracticeDetailRead.model_rebuild()
PracticeTopicResponse.model_rebuild()
PracticeSourceResponse.model_rebuild()
PracticeTopicAdd.model_rebuild()
PracticeSourceAdd.model_rebuild()
