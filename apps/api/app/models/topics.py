from __future__ import annotations

from datetime import datetime
from typing import TYPE_CHECKING

from sqlalchemy import BigInteger, ForeignKey, Identity, String, text
from sqlalchemy.orm import Mapped, mapped_column, relationship
from sqlalchemy.types import TIMESTAMP, Text

from app.models.base import Base
from app.types.ltree import LtreeType

if TYPE_CHECKING:
    from app.models.review_cards import ReviewCard


class Topic(Base):
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
    title: Mapped[str] = mapped_column(Text, nullable=False, server_default="")
    body: Mapped[str] = mapped_column(Text, nullable=False, server_default="")

    parent_id: Mapped[int | None] = mapped_column(
        BigInteger, ForeignKey("topics.id", ondelete="CASCADE"), nullable=True
    )
    path: Mapped[str | None] = mapped_column(LtreeType(), nullable=True)

    parent: Mapped["Topic | None"] = relationship(
        "Topic",
        remote_side="Topic.id",
        back_populates="children",
        foreign_keys=[parent_id],
    )
    children: Mapped[list["Topic"]] = relationship(
        "Topic",
        back_populates="parent",
        foreign_keys=[parent_id],
        passive_deletes=True,
    )

    review_cards: Mapped[list["ReviewCard"]] = relationship(
        back_populates="topic", passive_deletes=True
    )

    @property
    def parent_title(self) -> str | None:
        return self.parent.title if self.parent else None
