from __future__ import annotations

from datetime import datetime

from sqlalchemy import BigInteger, Enum, ForeignKey, text
from sqlalchemy.orm import Mapped, mapped_column, relationship
from sqlalchemy.types import TIMESTAMP

from app.models.base import Base


class Review(Base):
    __tablename__ = "reviews"

    todo_id: Mapped[int] = mapped_column(
        BigInteger, ForeignKey("todos.id"), primary_key=True
    )
    topic_id: Mapped[int] = mapped_column(
        BigInteger, ForeignKey("topics.id"), primary_key=True
    )
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

    # Relationships
    todo: Mapped["Todo"] = relationship(back_populates="reviews")
    topic: Mapped["Topic"] = relationship(back_populates="reviews")
