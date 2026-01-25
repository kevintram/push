from __future__ import annotations

from datetime import datetime
from typing import TYPE_CHECKING

from sqlalchemy import BigInteger, ForeignKey, Identity, text
from sqlalchemy.orm import Mapped, mapped_column, relationship
from sqlalchemy.types import TIMESTAMP

from app.models.base import Base

if TYPE_CHECKING:
    from app.models.sources import Source
    from app.models.topics import Topic


class SourcePrerequisite(Base):
    """Prerequisites for a source - what must be learned first.

    Prerequisites can be either topics or other sources.
    """

    __tablename__ = "source_prerequisites"

    id: Mapped[int] = mapped_column(BigInteger, Identity(always=True), primary_key=True)
    source_id: Mapped[int] = mapped_column(
        BigInteger, ForeignKey("sources.id", ondelete="CASCADE"), nullable=False
    )
    prereq_topic_id: Mapped[int | None] = mapped_column(
        BigInteger, ForeignKey("topics.id", ondelete="CASCADE"), nullable=True
    )
    prereq_source_id: Mapped[int | None] = mapped_column(
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

    # Relationships
    source: Mapped["Source"] = relationship("Source", foreign_keys=[source_id])
    prereq_topic: Mapped["Topic | None"] = relationship(
        "Topic", foreign_keys=[prereq_topic_id]
    )
    prereq_source: Mapped["Source | None"] = relationship(
        "Source", foreign_keys=[prereq_source_id]
    )
