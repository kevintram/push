from __future__ import annotations

from datetime import datetime
from typing import TYPE_CHECKING

from sqlalchemy import BigInteger, ForeignKey, Identity, text
from sqlalchemy.dialects.postgresql import insert
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import Mapped, mapped_column, relationship
from sqlalchemy.types import TIMESTAMP

from app.models.base import Base

if TYPE_CHECKING:
    from app.models.sources import Source
    from app.models.topics import Topic


class EntityRelation(Base):
    """Unified relation table for topic↔topic, topic↔source, source↔source relations."""

    __tablename__ = "entity_relations"

    id: Mapped[int] = mapped_column(BigInteger, Identity(always=True), primary_key=True)
    from_topic_id: Mapped[int | None] = mapped_column(
        BigInteger, ForeignKey("topics.id", ondelete="CASCADE"), nullable=True
    )
    from_source_id: Mapped[int | None] = mapped_column(
        BigInteger, ForeignKey("sources.id", ondelete="CASCADE"), nullable=True
    )
    to_topic_id: Mapped[int | None] = mapped_column(
        BigInteger, ForeignKey("topics.id", ondelete="CASCADE"), nullable=True
    )
    to_source_id: Mapped[int | None] = mapped_column(
        BigInteger, ForeignKey("sources.id", ondelete="CASCADE"), nullable=True
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

    # Relationships for eager loading
    from_topic: Mapped["Topic | None"] = relationship(
        "Topic", foreign_keys=[from_topic_id]
    )
    from_source: Mapped["Source | None"] = relationship(
        "Source", foreign_keys=[from_source_id]
    )
    to_topic: Mapped["Topic | None"] = relationship("Topic", foreign_keys=[to_topic_id])
    to_source: Mapped["Source | None"] = relationship(
        "Source", foreign_keys=[to_source_id]
    )

    @classmethod
    async def insert_or_ignore(
        cls,
        session: AsyncSession,
        *,
        from_topic_id: int | None = None,
        from_source_id: int | None = None,
        to_topic_id: int | None = None,
        to_source_id: int | None = None,
    ) -> None:
        """Insert an entity relation, ignoring duplicates."""
        stmt = (
            insert(cls)
            .values(
                from_topic_id=from_topic_id,
                from_source_id=from_source_id,
                to_topic_id=to_topic_id,
                to_source_id=to_source_id,
            )
            .on_conflict_do_nothing(constraint="unique_relation")
        )
        await session.execute(stmt)
