from __future__ import annotations

from datetime import date, datetime

from sqlalchemy import BigInteger, Date, Identity, String, func, text
from sqlalchemy.orm import Mapped, column_property, mapped_column, relationship
from sqlalchemy.types import TIMESTAMP, Text

from app.models.base import Base

# Import Review for order_by in relationship
from app.models.reviews import Review


class ReviewSession(Base):
    __tablename__ = "review_sessions"

    id: Mapped[int] = mapped_column(BigInteger, Identity(always=True), primary_key=True)
    description: Mapped[str] = mapped_column(Text, nullable=False, default="")
    notes: Mapped[str] = mapped_column(Text, nullable=False, server_default="")
    scheduled_at: Mapped[date] = mapped_column(Date)
    completed_at: Mapped[date] = mapped_column(Date)
    effective_date: Mapped[date] = column_property(
        func.coalesce(completed_at, scheduled_at)
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
    user_id: Mapped[str] = mapped_column(String, nullable=False)
    reviews: Mapped[list["Review"]] = relationship(
        back_populates="review_session", order_by=Review.inserted_at.desc()
    )
