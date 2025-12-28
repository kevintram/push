from __future__ import annotations

from datetime import date
from typing import Literal, Union

from pydantic import BaseModel, ConfigDict

from app.schemas.reviews import ReviewListItem
from app.schemas.review_sessions import ReviewSessionReadWithReviews


class ReviewEntrySession(BaseModel):
    """A review session entry in the unified list."""

    model_config = ConfigDict(from_attributes=True)

    type: Literal["session"] = "session"
    effective_date: date | None
    data: ReviewSessionReadWithReviews


class ReviewEntryReview(BaseModel):
    """A standalone review entry in the unified list."""

    model_config = ConfigDict(from_attributes=True)

    type: Literal["review"] = "review"
    effective_date: date | None
    data: ReviewListItem


ReviewEntry = Union[ReviewEntrySession, ReviewEntryReview]
