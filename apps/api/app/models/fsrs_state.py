from __future__ import annotations

from datetime import datetime, date

from sqlalchemy import BigInteger, Boolean, Enum, Identity, Integer, text
from sqlalchemy.orm import Mapped, mapped_column
from sqlalchemy.types import TIMESTAMP, Date, REAL

from app.models.base import Base


class FsrsState(Base):
    """Shared FSRS state for Topics, Sources, and Practices."""

    __tablename__ = "fsrs_states"

    id: Mapped[int] = mapped_column(BigInteger, Identity(always=True), primary_key=True)
    stability: Mapped[float | None] = mapped_column(REAL, nullable=True)
    difficulty: Mapped[float | None] = mapped_column(REAL, nullable=True)
    state: Mapped[str] = mapped_column(
        Enum("LEARNING", "REVIEW", "RELEARNING", name="learning_state"),
        nullable=False,
        server_default=text("'LEARNING'::learning_state"),
    )
    step: Mapped[int | None] = mapped_column(Integer, nullable=True)
    last_reviewed_at: Mapped[date | None] = mapped_column(Date, nullable=True)
    srs_enabled: Mapped[bool] = mapped_column(
        Boolean, nullable=False, server_default=text("false")
    )

    # Inherited fields (propagated from parent at creation time)
    inherited_stability: Mapped[float | None] = mapped_column(REAL, nullable=True)
    inherited_difficulty: Mapped[float | None] = mapped_column(REAL, nullable=True)
    inherited_state: Mapped[str | None] = mapped_column(
        Enum("LEARNING", "REVIEW", "RELEARNING", name="learning_state"),
        nullable=True,
    )
    inherited_step: Mapped[int | None] = mapped_column(Integer, nullable=True)
    inherited_last_review: Mapped[date | None] = mapped_column(Date, nullable=True)

    inserted_at: Mapped[datetime] = mapped_column(
        TIMESTAMP(timezone=True),
        nullable=False,
        server_default=text("timezone('utc'::text, now())"),
    )
    updated_at: Mapped[datetime] = mapped_column(
        TIMESTAMP(timezone=True),
        nullable=False,
        server_default=text("timezone('utc'::text, now())"),
    )
