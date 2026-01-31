"""Entity relations schemas for the unified relations model.

Supports topic↔topic, topic↔source, source↔topic, source↔source relations.
"""

from __future__ import annotations

from enum import Enum
from typing import TYPE_CHECKING

from pydantic import BaseModel, ConfigDict, model_validator

if TYPE_CHECKING:
    from app.schemas.sources import SourceCreate
    from app.schemas.topics import TopicCreate


class EntityType(str, Enum):
    TOPIC = "topic"
    SOURCE = "source"


class RelatedEntityRead(BaseModel):
    """A related entity (topic or source) with minimal info for display."""

    model_config = ConfigDict(from_attributes=True)

    entity_type: EntityType
    id: int
    name: str | None = None  # topic.name
    title: str | None = None  # source.title


class EntityRelationRead(BaseModel):
    """A relation between two entities."""

    model_config = ConfigDict(from_attributes=True)

    id: int
    from_entity: RelatedEntityRead
    to_entity: RelatedEntityRead


class EntityRelationCreate(BaseModel):
    """Create a relation from a topic/source to another topic/source."""

    to_entity_type: EntityType
    to_entity_id: int | None = None
    to_topic: TopicCreate | None = None
    to_source: SourceCreate | None = None

    @model_validator(mode="after")
    def validate_entity_type(self):
        if self.to_entity_type not in (EntityType.TOPIC, EntityType.SOURCE):
            raise ValueError("to_entity_type must be 'topic' or 'source'")
        provided = [
            self.to_entity_id is not None,
            self.to_topic is not None,
            self.to_source is not None,
        ]
        if sum(provided) != 1:
            raise ValueError("Provide exactly one of to_entity_id, to_topic, to_source")
        if self.to_entity_type == EntityType.TOPIC and self.to_source is not None:
            raise ValueError("to_source cannot be set when to_entity_type is 'topic'")
        if self.to_entity_type == EntityType.SOURCE and self.to_topic is not None:
            raise ValueError("to_topic cannot be set when to_entity_type is 'source'")
        return self


class PrerequisiteTopicRead(BaseModel):
    """Minimal topic info for prerequisite display."""

    model_config = ConfigDict(from_attributes=True)

    id: int
    name: str


class PrerequisiteSourceRead(BaseModel):
    """Minimal source info for prerequisite display."""

    model_config = ConfigDict(from_attributes=True)

    id: int
    title: str


class SourcePrerequisiteRead(BaseModel):
    """A prerequisite for a source."""

    model_config = ConfigDict(from_attributes=True)

    id: int
    source_id: int
    prereq_topic_id: int | None = None
    prereq_source_id: int | None = None
    prereq_topic: PrerequisiteTopicRead | None = None
    prereq_source: PrerequisiteSourceRead | None = None


class SourcePrerequisiteCreate(BaseModel):
    """Create a prerequisite for a source."""

    prereq_entity_type: EntityType
    prereq_entity_id: int | None = None
    prereq_topic: TopicCreate | None = None
    prereq_source: SourceCreate | None = None

    @model_validator(mode="after")
    def validate_entity_type(self):
        if self.prereq_entity_type not in (EntityType.TOPIC, EntityType.SOURCE):
            raise ValueError("prereq_entity_type must be 'topic' or 'source'")
        provided = [
            self.prereq_entity_id is not None,
            self.prereq_topic is not None,
            self.prereq_source is not None,
        ]
        if sum(provided) != 1:
            raise ValueError(
                "Provide exactly one of prereq_entity_id, prereq_topic, prereq_source"
            )
        if (
            self.prereq_entity_type == EntityType.TOPIC
            and self.prereq_source is not None
        ):
            raise ValueError(
                "prereq_source cannot be set when prereq_entity_type is 'topic'"
            )
        if (
            self.prereq_entity_type == EntityType.SOURCE
            and self.prereq_topic is not None
        ):
            raise ValueError(
                "prereq_topic cannot be set when prereq_entity_type is 'source'"
            )
        return self
