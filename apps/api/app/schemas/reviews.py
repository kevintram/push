from __future__ import annotations

from datetime import date, datetime

from pydantic import BaseModel, ConfigDict


class ReviewBase(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    rating: str | None
    description: str = ""
    notes: str = ""
    scheduled_at: date | None = None
    completed_at: date | None = None


class ReviewRead(ReviewBase):
    model_config = ConfigDict(from_attributes=True)

    id: int
    note_id: int
    inserted_at: datetime
    updated_at: datetime
    effective_date: date | None = None

    # FSRS state before review
    stability_before: float | None
    difficulty_before: float | None
    state_before: str | None
    step_before: int | None
    due_before: date | None

    # FSRS state after review
    stability_after: float | None
    difficulty_after: float | None
    state_after: str | None
    step_after: int | None
    due_after: date | None


class NoteSummary(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    title: str
    body: str


class ReviewListItem(ReviewRead):
    model_config = ConfigDict(from_attributes=True)

    note: NoteSummary


class ReviewWithNote(ReviewRead):
    model_config = ConfigDict(from_attributes=True)

    note: NoteSummary


class ReviewCreate(BaseModel):
    model_config = ConfigDict(from_attributes=True, extra="forbid")

    note_id: int
    description: str = ""
    notes: str = ""
    scheduled_at: date | None = None
    completed_at: date | None = None
    rating: str | None = None


class ReviewUpdate(BaseModel):
    model_config = ConfigDict(from_attributes=True, extra="forbid")

    rating: str | None = None
    description: str | None = None
    notes: str | None = None
    scheduled_at: date | None = None
    completed_at: date | None = None
    note_id: int | None = None
