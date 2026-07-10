from __future__ import annotations

from enum import Enum

from pydantic import ConfigDict

from app.schemas.base import ApiModel


class StatusBadgeKeyEnum(str, Enum):
    DUE = "due"
    HAZY_SOON = "hazy_soon"
    FORGOTTEN_SOON = "forgotten_soon"
    HAZY_FOR = "hazy_for"
    FORGOTTEN_FOR = "forgotten_for"


class StatusBadgeToneEnum(str, Enum):
    DANGER = "danger"
    INFO = "info"
    NEUTRAL = "neutral"
    WARNING = "warning"


class StatusBadge(ApiModel):
    model_config = ConfigDict(from_attributes=True)

    key: StatusBadgeKeyEnum
    label: str
    tooltip: str | None = None
    tone: StatusBadgeToneEnum
    review_id: int | None = None
