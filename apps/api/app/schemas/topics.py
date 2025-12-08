from __future__ import annotations

from datetime import datetime, date

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
    due: date | None = None
    srs_enabled: bool = True


class TopicRead(TopicBase):
    model_config = ConfigDict(from_attributes=True)

    id: int
    inserted_at: datetime
    updated_at: datetime


class TopicReadWithRelationships(TopicRead):
    model_config = ConfigDict(from_attributes=True)

    parents: list["TopicRead"]
    children: list["TopicRead"]


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
