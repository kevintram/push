from __future__ import annotations

from datetime import datetime, date
from enum import Enum

from pydantic import BaseModel, ConfigDict, model_validator



class TopicBase(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    name: str
    notes: str
    stability: float | None = None
    difficulty: float | None = None
    state: str = "LEARNING"
    step: int | None = None
    archived: bool
    inboxed: bool
    last_reviewed_at: date | None = None
    srs_enabled: bool = True


class TopicRead(TopicBase):
    model_config = ConfigDict(from_attributes=True)

    id: int
    inserted_at: datetime
    updated_at: datetime
    scheduled_at: date | None = None
    retrievability: float | None = None


class TopicReadWithRelationships(TopicRead):
    model_config = ConfigDict(from_attributes=True)

    parents: list["TopicRead"]
    children: list["TopicRead"]


class RelationshipDirection(str, Enum):
    OUTGOING = "outgoing"
    INCOMING = "incoming"


class TopicRelatedRead(TopicRead):
    model_config = ConfigDict(from_attributes=True)

    relationship_direction: RelationshipDirection


class TopicCreate(TopicBase):
    model_config = ConfigDict(from_attributes=True)


class TopicChildRelationshipCreate(BaseModel):
    # Mutually exclusive: provide child_id OR child (not both)
    child_id: int | None = None
    child: "TopicCreate | None" = None

    @model_validator(mode="after")
    def validate_mutually_exclusive_fields(self) -> "TopicChildRelationshipCreate":
        if self.child_id is not None and self.child is not None:
            raise ValueError("Cannot provide both child_id and child")
        if self.child_id is None and self.child is None:
            raise ValueError("Must provide either child_id or child")
        return self


class TopicParentRelationshipCreate(BaseModel):
    # Mutually exclusive: provide parent_id OR parent (not both)
    parent_id: int | None = None
    parent: "TopicCreate | None" = None

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

    parent: TopicReadWithRelationships
    child: TopicReadWithRelationships


class TopicUpdate(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    name: str | None = None
    notes: str | None = None
    archived: bool | None = None
    inboxed: bool | None = None
    srs_enabled: bool | None = None


class TopicOtherRelationshipCreate(BaseModel):
    # Mutually exclusive: provide to_topic_id OR to_topic (not both)
    to_topic_id: int | None = None
    to_topic: "TopicCreate | None" = None

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
