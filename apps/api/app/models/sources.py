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
    get_freshness_tier,
    get_next_tier_threshold,
)

if TYPE_CHECKING:
    from app.models.entity_relations import EntityRelation
    from app.models.fsrs_state import FsrsState
    from app.models.reviews import Review
    from app.models.source_prerequisites import SourcePrerequisite
    from app.models.topics import Topic


# Define junction tables first so they can be referenced in column_property
t_source_topics = Table(
    "source_topics",
    Base.metadata,
    Column(
        "source_id",
        BigInteger,
        ForeignKey("sources.id", ondelete="CASCADE"),
        primary_key=True,
        nullable=False,
    ),
    Column(
        "topic_id",
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


class Source(Base):
    __tablename__ = "sources"

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
    notes: Mapped[str] = mapped_column(Text, nullable=False, server_default="")

    # Tree hierarchy with ltree materialized path
    parent_id: Mapped[int | None] = mapped_column(
        BigInteger, ForeignKey("sources.id", ondelete="RESTRICT"), nullable=True
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
    parent: Mapped["Source | None"] = relationship(
        "Source",
        remote_side="Source.id",
        back_populates="children",
        foreign_keys=[parent_id],
    )
    children: Mapped[list["Source"]] = relationship(
        "Source", back_populates="parent", foreign_keys=[parent_id]
    )
    fsrs_state: Mapped["FsrsState | None"] = relationship("FsrsState", lazy="joined")

    # Topics this source covers
    topics: Mapped[list["Topic"]] = relationship(
        "Topic",
        secondary=t_source_topics,
        back_populates="sources",
        viewonly=True,
    )

    reviews: Mapped[list["Review"]] = relationship("Review", back_populates="source")

    # Entity relations (unified, for related topics/sources)
    related_outgoing_relations: Mapped[list["EntityRelation"]] = relationship(
        "EntityRelation",
        foreign_keys="EntityRelation.from_source_id",
        viewonly=True,
    )
    related_incoming_relations: Mapped[list["EntityRelation"]] = relationship(
        "EntityRelation",
        foreign_keys="EntityRelation.to_source_id",
        viewonly=True,
    )

    # Prerequisites (what must be learned before this source)
    prerequisites: Mapped[list["SourcePrerequisite"]] = relationship(
        "SourcePrerequisite",
        foreign_keys="SourcePrerequisite.source_id",
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
    def days_until_next_tier(self) -> int | None:
        if self.fsrs_state is None or self.fsrs_state.stability is None:
            return None
        target_retrievability = get_next_tier_threshold(self.retrievability)
        if target_retrievability is None:
            return None
        return calculate_days_until_threshold(
            self.fsrs_state.stability,
            self.fsrs_state.last_reviewed_at,
            target_retrievability=target_retrievability,
        )

    @property
    def freshness_tier(self) -> str | None:
        return get_freshness_tier(self.retrievability)

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
# - With asyncpg, lazy loading causes `MissingGreenlet` errors. `column_property` always uses
#   a subquery, avoiding async lazy load issues.
_source_alias = Source.__table__.alias("children_alias")

Source.children_count = column_property(
    select(func.count())
    .select_from(_source_alias)
    .where(_source_alias.c.parent_id == Source.id)
    .correlate(Source)
    .scalar_subquery()
)

Source.topics_count = column_property(
    select(func.count())
    .select_from(t_source_topics)
    .where(t_source_topics.c.source_id == Source.id)
    .correlate(Source)
    .scalar_subquery()
)

# Import for count column properties (after class to avoid circular import)
from app.models.entity_relations import EntityRelation  # noqa: E402
from app.models.reviews import Review  # noqa: E402
from app.models.source_prerequisites import SourcePrerequisite  # noqa: E402

Source.last_review_rating = column_property(
    select(Review.rating)
    .where(
        Review.source_id == Source.id,
        Review.completed_at.isnot(None),
    )
    .order_by(Review.completed_at.desc(), Review.id.desc())
    .limit(1)
    .correlate(Source)
    .scalar_subquery()
)

Source.related_outgoing_count = column_property(
    select(func.count())
    .select_from(EntityRelation)
    .where(EntityRelation.from_source_id == Source.id)
    .correlate(Source)
    .scalar_subquery()
)

Source.related_incoming_count = column_property(
    select(func.count())
    .select_from(EntityRelation)
    .where(EntityRelation.to_source_id == Source.id)
    .correlate(Source)
    .scalar_subquery()
)

Source.prerequisites_count = column_property(
    select(func.count())
    .select_from(SourcePrerequisite)
    .where(SourcePrerequisite.source_id == Source.id)
    .correlate(Source)
    .scalar_subquery()
)

# Import for practices relationship (after class to avoid circular import)
from app.models.practices import t_practice_sources  # noqa: E402

Source.practices = relationship(
    "Practice",
    secondary="practice_sources",
    viewonly=True,
)

Source.practices_count = column_property(
    select(func.count())
    .select_from(t_practice_sources)
    .where(t_practice_sources.c.source_id == Source.id)
    .correlate(Source)
    .scalar_subquery()
)
