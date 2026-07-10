from __future__ import annotations

from datetime import datetime

from pydantic import ConfigDict

from app.schemas.base import ApiModel


class TopicBase(ApiModel):
    model_config = ConfigDict(from_attributes=True)

    title: str = ""
    body: str = ""
    parent_id: int | None = None


class TopicRead(TopicBase):
    model_config = ConfigDict(from_attributes=True)

    id: int
    parent_title: str | None = None
    inserted_at: datetime
    updated_at: datetime


class TopicCreate(TopicBase):
    model_config = ConfigDict(from_attributes=True, extra="forbid")


class TopicUpdate(ApiModel):
    model_config = ConfigDict(from_attributes=True, extra="forbid")

    title: str | None = None
    body: str | None = None
    parent_id: int | None = None
