from __future__ import annotations

from datetime import datetime

from sqlalchemy import BigInteger, Identity, String, text
from sqlalchemy.orm import Mapped, mapped_column, relationship
from sqlalchemy.types import TIMESTAMP, Boolean, Integer, Numeric, Text

from app.models.base import Base


class Topics(Base):
    __tablename__ = "topics"

    id: Mapped[int] = mapped_column(BigInteger, Identity(always=True), primary_key=True)
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
    name: Mapped[str] = mapped_column(Text, nullable=False, server_default="")
    notes: Mapped[str] = mapped_column(Text, nullable=False, server_default="")
    stability: Mapped[int] = mapped_column(
        Integer, nullable=False, server_default=text("1")
    )
    retrievability: Mapped[float] = mapped_column(
        Numeric(5, 4), nullable=False, server_default=text("0.0000")
    )
    is_archived: Mapped[bool] = mapped_column(
        Boolean, nullable=False, server_default=text("false")
    )
    is_inboxed: Mapped[bool] = mapped_column(
        Boolean, nullable=False, server_default=text("false")
    )
    todos: Mapped[list["Todos"]] = relationship(
        secondary="todos_topics", back_populates="topics"
    )
