from __future__ import annotations

from datetime import datetime, date

from sqlalchemy import (
    BigInteger,
    Enum,
    Float,
    Integer,
    ForeignKey,
    Identity,
    String,
    func,
    text,
)
from sqlalchemy.orm import Mapped, column_property, mapped_column, relationship
from sqlalchemy.types import TIMESTAMP, Date, Text
from typing import TYPE_CHECKING

from app.models.base import Base

if TYPE_CHECKING:
    from app.models.review_cards import ReviewCard


class Review(Base):
    __tablename__ = "reviews"

    id: Mapped[int] = mapped_column(BigInteger, Identity(always=True), primary_key=True)
    review_card_id: Mapped[int] = mapped_column(
        BigInteger, ForeignKey("review_cards.id", ondelete="CASCADE"), nullable=False
    )
    user_id: Mapped[str] = mapped_column(String, nullable=False)

    scheduled_at: Mapped[date | None] = mapped_column(Date, nullable=True)
    completed_at: Mapped[date | None] = mapped_column(Date, nullable=True)
    effective_date: Mapped[date] = column_property(
        func.coalesce(completed_at, scheduled_at)
    )
    description: Mapped[str] = mapped_column(
        Text, nullable=False, default="", server_default=""
    )
    notes: Mapped[str] = mapped_column(
        Text, nullable=False, default="", server_default=""
    )

    rating: Mapped[str | None] = mapped_column(
        Enum("miss", "hard", "good", "easy", name="rating"),
        nullable=True,
    )
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

    # Entity FSRS state before review
    stability_before: Mapped[float | None] = mapped_column(Float, nullable=True)
    difficulty_before: Mapped[float | None] = mapped_column(Float, nullable=True)
    state_before: Mapped[str | None] = mapped_column(
        Enum("LEARNING", "REVIEW", "RELEARNING", name="learning_state"),
        nullable=True,
    )
    step_before: Mapped[int | None] = mapped_column(Integer, nullable=True)
    due_before: Mapped[date | None] = mapped_column(Date, nullable=True)

    # Entity FSRS state after review
    stability_after: Mapped[float | None] = mapped_column(Float, nullable=True)
    difficulty_after: Mapped[float | None] = mapped_column(Float, nullable=True)
    state_after: Mapped[str | None] = mapped_column(
        Enum("LEARNING", "REVIEW", "RELEARNING", name="learning_state"),
        nullable=True,
    )
    step_after: Mapped[int | None] = mapped_column(Integer, nullable=True)
    due_after: Mapped[date | None] = mapped_column(Date, nullable=True)

    # Relationships
    review_card: Mapped["ReviewCard"] = relationship(back_populates="reviews")
