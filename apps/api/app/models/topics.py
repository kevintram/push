from __future__ import annotations

from datetime import datetime, date

from sqlalchemy import (
    BigInteger,
    CheckConstraint,
    Enum,
    ForeignKey,
    Identity,
    func,
    select,
    String,
    text,
    Table,
    Column,
)
from sqlalchemy.ext.hybrid import hybrid_property
from sqlalchemy.orm import Mapped, column_property, mapped_column, relationship
from sqlalchemy.types import TIMESTAMP, Boolean, Date, Integer, REAL, Text
from typing import TYPE_CHECKING

from app.models.base import Base
from app.models.reviews import Review
from app.utils.retrievability import calculate_retrievability

if TYPE_CHECKING:
    from app.models.reviews import Review


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
    name: Mapped[str] = mapped_column(Text, nullable=False, server_default="")
    notes: Mapped[str] = mapped_column(Text, nullable=False, server_default="")
    stability: Mapped[float | None] = mapped_column(
        REAL, nullable=True, info={"check_constraint": "stability > 0"}
    )
    inherited_stability: Mapped[float | None] = mapped_column(
        REAL, nullable=True, info={"check_constraint": "inherited_stability > 0"}
    )
    inherited_difficulty: Mapped[float | None] = mapped_column(
        REAL,
        nullable=True,
        info={"check_constraint": "inherited_difficulty >= 0 AND inherited_difficulty <= 10"},
    )
    inherited_state: Mapped[str | None] = mapped_column(String, nullable=True)
    inherited_step: Mapped[int | None] = mapped_column(Integer, nullable=True)
    inherited_last_review: Mapped[date | None] = mapped_column(Date, nullable=True)
    difficulty: Mapped[float | None] = mapped_column(
        REAL,
        nullable=True,
        info={"check_constraint": "difficulty >= 0 AND difficulty <= 10"},
    )
    state: Mapped[str] = mapped_column(
        Enum("LEARNING", "REVIEW", "RELEARNING", name="learning_state"),
        nullable=False,
        server_default=text("'LEARNING'::learning_state"),
    )
    step: Mapped[int | None] = mapped_column(Integer, nullable=True)
    archived: Mapped[bool] = mapped_column(
        Boolean, nullable=False, server_default=text("false")
    )
    inboxed: Mapped[bool] = mapped_column(
        Boolean, nullable=False, server_default=text("false")
    )
    last_reviewed_at: Mapped[date | None] = mapped_column(Date, nullable=True)
    srs_enabled: Mapped[bool] = mapped_column(
        Boolean, nullable=False, server_default=text("true")
    )
    scheduled_at: Mapped[date | None] = column_property(
        select(func.min(Review.scheduled_at))
        .where(
            Review.topic_id == id,
            Review.user_id == user_id,
            Review.completed_at.is_(None),
            Review.scheduled_at.isnot(None),
        )
        .correlate_except(Review)
        .scalar_subquery()
    )
    reviews: Mapped[list["Review"]] = relationship(back_populates="topic")
    parents: Mapped[list["Topic"]] = relationship(
        secondary="topics_closure",
        back_populates="children",
        primaryjoin="and_(Topic.id == topics_closure.c.descendant, topics_closure.c.depth == 1)",
        secondaryjoin="topics_closure.c.ancestor == Topic.id",
    )
    children: Mapped[list["Topic"]] = relationship(
        secondary="topics_closure",
        back_populates="parents",
        primaryjoin="and_(Topic.id == topics_closure.c.ancestor, topics_closure.c.depth == 1)",
        secondaryjoin="topics_closure.c.descendant == Topic.id",
    )
    related_outgoing: Mapped[list["Topic"]] = relationship(
        "Topic",
        secondary="topic_other_relations",
        primaryjoin="Topic.id == topic_other_relations.c.from_topic_id",
        secondaryjoin="topic_other_relations.c.to_topic_id == Topic.id",
        foreign_keys="[topic_other_relations.c.from_topic_id, topic_other_relations.c.to_topic_id]",
        viewonly=True,
    )
    related_incoming: Mapped[list["Topic"]] = relationship(
        "Topic",
        secondary="topic_other_relations",
        primaryjoin="Topic.id == topic_other_relations.c.to_topic_id",
        secondaryjoin="topic_other_relations.c.from_topic_id == Topic.id",
        foreign_keys="[topic_other_relations.c.to_topic_id, topic_other_relations.c.from_topic_id]",
        viewonly=True,
    )

    @hybrid_property
    def retrievability(self) -> float | None:
        return calculate_retrievability(self.stability, self.last_reviewed_at)


t_topics_closure = Table(
    "topics_closure",
    Base.metadata,
    Column(
        "ancestor",
        BigInteger,
        ForeignKey("topics.id", ondelete="CASCADE"),
        nullable=False,
        primary_key=True,
    ),
    Column(
        "descendant",
        BigInteger,
        ForeignKey("topics.id", ondelete="CASCADE"),
        nullable=False,
        primary_key=True,
    ),
    Column("depth", Integer, server_default="0", primary_key=True),
    Column("count", Integer, nullable=False, server_default="1"),
    Column(
        "inserted_at",
        TIMESTAMP(timezone=True),
        nullable=False,
        server_default=text("timezone('utc'::text, now())"),
    ),
    Column(
        "updated_at",
        TIMESTAMP(timezone=True),
        nullable=False,
        server_default=text("timezone('utc'::text, now())"),
    ),
    CheckConstraint("count <= depth OR depth = 0", name="max_paths"),
)

t_topic_other_relations = Table(
    "topic_other_relations",
    Base.metadata,
    Column(
        "from_topic_id",
        BigInteger,
        ForeignKey("topics.id", ondelete="CASCADE"),
        primary_key=True,
        nullable=False,
    ),
    Column(
        "to_topic_id",
        BigInteger,
        ForeignKey("topics.id", ondelete="CASCADE"),
        primary_key=True,
        nullable=False,
    ),
    Column(
        "inserted_at",
        TIMESTAMP(timezone=True),
        nullable=False,
        server_default=text("timezone('utc'::text, now())"),
    ),
    Column(
        "updated_at",
        TIMESTAMP(timezone=True),
        nullable=False,
        server_default=text("timezone('utc'::text, now())"),
    ),
)