from __future__ import annotations

from datetime import datetime, date

from sqlalchemy import BigInteger, Enum, Float, Integer, ForeignKey, Identity, String, text
from sqlalchemy.orm import Mapped, mapped_column, relationship
from sqlalchemy.types import Date, TIMESTAMP

from app.models.base import Base


class Review(Base):
    __tablename__ = "reviews"

    id: Mapped[int] = mapped_column(BigInteger, Identity(always=True), primary_key=True)
    todo_id: Mapped[int] = mapped_column(
        BigInteger, ForeignKey("todos.id"), nullable=False
    )
    topic_id: Mapped[int] = mapped_column(
        BigInteger, ForeignKey("topics.id"), nullable=False
    )
    user_id: Mapped[str] = mapped_column(String, nullable=False)
    rating: Mapped[str] = mapped_column(
        Enum("miss", "hard", "good", "easy", name="rating"),
        nullable=False,
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

    # FSRS state before review
    stability_before: Mapped[float | None] = mapped_column(Float, nullable=True)
    difficulty_before: Mapped[float | None] = mapped_column(Float, nullable=True)
    state_before: Mapped[str | None] = mapped_column(
        Enum("LEARNING", "REVIEW", "RELEARNING", name="learning_state"),
        nullable=True,
    )
    step_before: Mapped[int | None] = mapped_column(Integer, nullable=True)

    # FSRS state after review
    stability_after: Mapped[float | None] = mapped_column(Float, nullable=True)
    difficulty_after: Mapped[float | None] = mapped_column(Float, nullable=True)
    state_after: Mapped[str | None] = mapped_column(
        Enum("LEARNING", "REVIEW", "RELEARNING", name="learning_state"),
        nullable=True,
    )
    step_after: Mapped[int | None] = mapped_column(Integer, nullable=True)
    due_after: Mapped[date | None] = mapped_column(Date, nullable=True)

    # Relationships
    todo: Mapped["Todo"] = relationship(back_populates="reviews")
    topic: Mapped["Topic"] = relationship(back_populates="reviews")
