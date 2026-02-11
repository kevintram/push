"""Discriminated union schemas for full entity summaries with entity_type.

Separated from entity_relations.py to avoid circular imports: both
topics.py and sources.py import from entity_relations.py, so we cannot
import their summary schemas there.
"""

from __future__ import annotations

from typing import Annotated, Literal, Union

from pydantic import BaseModel, ConfigDict, Discriminator, Field

from app.schemas.sources import SourceSummaryRead
from app.schemas.topics import TopicSummaryRead


class TopicEntitySummary(TopicSummaryRead):
    """Topic summary with entity_type discriminator."""

    model_config = ConfigDict(from_attributes=True)

    entity_type: Literal["topic"] = "topic"


class SourceEntitySummary(SourceSummaryRead):
    """Source summary with entity_type discriminator."""

    model_config = ConfigDict(from_attributes=True)

    entity_type: Literal["source"] = "source"


EntitySummaryRead = Annotated[
    Union[TopicEntitySummary, SourceEntitySummary],
    Discriminator("entity_type"),
]


class EntityRelationsRead(BaseModel):
    """Outgoing and incoming entity summaries for relation tabs."""

    outgoing: list[EntitySummaryRead] = Field(default_factory=list)
    incoming: list[EntitySummaryRead] = Field(default_factory=list)
