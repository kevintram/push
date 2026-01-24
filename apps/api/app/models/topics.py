from __future__ import annotations

from datetime import datetime
from typing import TYPE_CHECKING

from sqlalchemy import (
    BigInteger,
    Column,
    ForeignKey,
    Identity,
    Table,
    func,
    select,
    String,
    text,
)
from sqlalchemy.ext.hybrid import hybrid_property
from sqlalchemy.orm import Mapped, column_property, mapped_column, relationship
from sqlalchemy.types import TIMESTAMP, Boolean, Text

from app.types.ltree import LtreeType

from app.models.base import Base
from app.utils.retrievability import (
    calculate_retrievability,
    calculate_days_until_threshold,
)

if TYPE_CHECKING:
    from app.models.fsrs_state import FsrsState
    from app.models.reviews import Review
    from app.models.sources import Source


# Define junction tables first so they can be referenced in column_property
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

    # Tree hierarchy with ltree materialized path
    parent_id: Mapped[int | None] = mapped_column(
        BigInteger, ForeignKey("topics.id", ondelete="RESTRICT"), nullable=True
    )
    # path is computed by database trigger (BEFORE INSERT/UPDATE)
    path: Mapped[str | None] = mapped_column(LtreeType(), nullable=True)

    # FSRS state (shared table)
    fsrs_state_id: Mapped[int | None] = mapped_column(
        BigInteger, ForeignKey("fsrs_states.id", ondelete="SET NULL"), unique=True
    )

    # Status flags
    archived: Mapped[bool] = mapped_column(
        Boolean, nullable=False, server_default=text("false")
    )
    inboxed: Mapped[bool] = mapped_column(
        Boolean, nullable=False, server_default=text("false")
    )

    # Relationships
    parent: Mapped["Topic | None"] = relationship(
        "Topic",
        remote_side="Topic.id",
        back_populates="children",
        foreign_keys=[parent_id],
    )
    children: Mapped[list["Topic"]] = relationship(
        "Topic", back_populates="parent", foreign_keys=[parent_id]
    )
    fsrs_state: Mapped["FsrsState | None"] = relationship("FsrsState", lazy="joined")
    reviews: Mapped[list["Review"]] = relationship(back_populates="topic")

    # Related topics (non-hierarchical)
    related_outgoing: Mapped[list["Topic"]] = relationship(
        "Topic",
        secondary=t_topic_other_relations,
        primaryjoin=lambda: Topic.id == t_topic_other_relations.c.from_topic_id,
        secondaryjoin=lambda: t_topic_other_relations.c.to_topic_id == Topic.id,
        viewonly=True,
    )
    related_incoming: Mapped[list["Topic"]] = relationship(
        "Topic",
        secondary=t_topic_other_relations,
        primaryjoin=lambda: Topic.id == t_topic_other_relations.c.to_topic_id,
        secondaryjoin=lambda: t_topic_other_relations.c.from_topic_id == Topic.id,
        viewonly=True,
    )

    # Sources that cover this topic (Phase 2)
    # Note: secondary table import is deferred to avoid circular import
    sources: Mapped[list["Source"]] = relationship(
        "Source",
        secondary="source_topics",
        back_populates="topics",
        viewonly=True,
    )

    # Computed property for retrievability
    @hybrid_property
    def retrievability(self) -> float | None:
        if self.fsrs_state is None:
            return None
        return calculate_retrievability(
            self.fsrs_state.stability, self.fsrs_state.last_reviewed_at
        )

    @property
    def days_until_threshold(self) -> int | None:
        if self.fsrs_state is None or self.fsrs_state.stability is None:
            return None
        return calculate_days_until_threshold(
            self.fsrs_state.stability,
            self.fsrs_state.last_reviewed_at,
            target_retrievability=0.9,
        )

    @property
    def bucket(self) -> str | None:
        days = self.days_until_threshold
        if days is None:
            return None
        if days < 0:
            return "LATE"
        elif days == 0:
            return "ON_TIME"
        else:
            return "EARLY"

    # FSRS field accessors for backward compatibility with schemas
    @property
    def stability(self) -> float | None:
        return self.fsrs_state.stability if self.fsrs_state else None

    @property
    def difficulty(self) -> float | None:
        return self.fsrs_state.difficulty if self.fsrs_state else None

    @property
    def state(self) -> str:
        return self.fsrs_state.state if self.fsrs_state else "LEARNING"

    @property
    def step(self) -> int | None:
        return self.fsrs_state.step if self.fsrs_state else None

    @property
    def last_reviewed_at(self):
        return self.fsrs_state.last_reviewed_at if self.fsrs_state else None

    @property
    def srs_enabled(self) -> bool:
        return self.fsrs_state.srs_enabled if self.fsrs_state else False

    @property
    def inherited_stability(self) -> float | None:
        return self.fsrs_state.inherited_stability if self.fsrs_state else None

    @property
    def inherited_difficulty(self) -> float | None:
        return self.fsrs_state.inherited_difficulty if self.fsrs_state else None

    @property
    def inherited_state(self) -> str | None:
        return self.fsrs_state.inherited_state if self.fsrs_state else None

    @property
    def inherited_step(self) -> int | None:
        return self.fsrs_state.inherited_step if self.fsrs_state else None

    @property
    def inherited_last_review(self):
        return self.fsrs_state.inherited_last_review if self.fsrs_state else None


# Count column properties defined after class to avoid self-reference issues.
# We use column_property instead of hybrid_property because:
# - `hybrid_property` instance-side would use `len(self.children)`, triggering lazy loading.
# - With asyncpg, lazy loading causes `MissingGreenlet` errors.`column_property` always uses
#  - a subquery, avoiding async lazy load issues.
_topic_alias = Topic.__table__.alias("children_alias")

Topic.children_count = column_property(
    select(func.count())
    .select_from(_topic_alias)
    .where(_topic_alias.c.parent_id == Topic.id)
    .correlate(Topic)
    .scalar_subquery()
)

Topic.related_outgoing_count = column_property(
    select(func.count())
    .select_from(t_topic_other_relations)
    .where(t_topic_other_relations.c.from_topic_id == Topic.id)
    .correlate(Topic)
    .scalar_subquery()
)

Topic.related_incoming_count = column_property(
    select(func.count())
    .select_from(t_topic_other_relations)
    .where(t_topic_other_relations.c.to_topic_id == Topic.id)
    .correlate(Topic)
    .scalar_subquery()
)

# Import source_topics table for sources_count (Phase 2)
# Done here to avoid circular import at module level
from app.models.sources import t_source_topics  # noqa: E402

Topic.sources_count = column_property(
    select(func.count())
    .select_from(t_source_topics)
    .where(t_source_topics.c.topic_id == Topic.id)
    .correlate(Topic)
    .scalar_subquery()
)
