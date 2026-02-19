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

from app.models.base import Base
from app.utils.retrievability import (
    calculate_retrievability,
    calculate_days_in_current_tier,
    calculate_days_until_threshold,
    get_freshness_tier,
    get_next_tier_threshold,
)

if TYPE_CHECKING:
    from app.models.fsrs_state import FsrsState
    from app.models.reviews import Review
    from app.models.sources import Source
    from app.models.topics import Topic


# Define junction tables first so they can be referenced in column_property
t_practice_topics = Table(
    "practice_topics",
    Base.metadata,
    Column(
        "practice_id",
        BigInteger,
        ForeignKey("practices.id", ondelete="CASCADE"),
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

t_practice_sources = Table(
    "practice_sources",
    Base.metadata,
    Column(
        "practice_id",
        BigInteger,
        ForeignKey("practices.id", ondelete="CASCADE"),
        primary_key=True,
        nullable=False,
    ),
    Column(
        "source_id",
        BigInteger,
        ForeignKey("sources.id", ondelete="CASCADE"),
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


class Practice(Base):
    __tablename__ = "practices"

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
    prompt: Mapped[str] = mapped_column(Text, nullable=False, server_default="")
    answer: Mapped[str] = mapped_column(Text, nullable=False, server_default="")

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
    fsrs_state: Mapped["FsrsState | None"] = relationship("FsrsState", lazy="joined")
    reviews: Mapped[list["Review"]] = relationship(
        "Review",
        back_populates="practice",
        passive_deletes=True,
    )

    # Topics this practice assesses
    topics: Mapped[list["Topic"]] = relationship(
        "Topic",
        secondary=t_practice_topics,
        viewonly=True,
    )

    # Sources this practice assesses
    sources: Mapped[list["Source"]] = relationship(
        "Source",
        secondary=t_practice_sources,
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
    def days_in_current_tier(self) -> int | None:
        if self.fsrs_state is None or self.fsrs_state.stability is None:
            return None
        return calculate_days_in_current_tier(
            self.fsrs_state.stability,
            self.fsrs_state.last_reviewed_at,
            self.retrievability,
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
Practice.topics_count = column_property(
    select(func.count())
    .select_from(t_practice_topics)
    .where(t_practice_topics.c.practice_id == Practice.id)
    .correlate(Practice)
    .scalar_subquery()
)

from app.models.reviews import Review  # noqa: E402

Practice.last_review_rating = column_property(
    select(Review.rating)
    .where(
        Review.practice_id == Practice.id,
        Review.completed_at.isnot(None),
    )
    .order_by(Review.completed_at.desc(), Review.id.desc())
    .limit(1)
    .correlate(Practice)
    .scalar_subquery()
)

Practice.sources_count = column_property(
    select(func.count())
    .select_from(t_practice_sources)
    .where(t_practice_sources.c.practice_id == Practice.id)
    .correlate(Practice)
    .scalar_subquery()
)
