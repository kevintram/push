from __future__ import annotations

from datetime import date, datetime
from enum import Enum as PyEnum
from typing import TYPE_CHECKING

from sqlalchemy import BigInteger, Enum, ForeignKey, Identity, String, text
from sqlalchemy.ext.hybrid import hybrid_property
from sqlalchemy.orm import Mapped, mapped_column, relationship
from sqlalchemy.types import TIMESTAMP, Text

from app.models.base import Base
from app.review_cards.status_badges import build_review_card_status_badges
from app.utils.retrievability import (
    calculate_days_in_current_tier,
    calculate_retrievability,
    compute_distance_to_retrievability,
    get_freshness_tier,
    get_next_tier_threshold,
)

if TYPE_CHECKING:
    from app.models.fsrs_state import FsrsState
    from app.models.reviews import Review
    from app.models.topics import Topic


class ReviewCardType(str, PyEnum):
    PRACTICE = "practice"
    FLASHCARD = "flashcard"


class ReviewCard(Base):
    __tablename__ = "review_cards"

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

    topic_id: Mapped[int] = mapped_column(
        BigInteger, ForeignKey("topics.id", ondelete="CASCADE"), nullable=False
    )
    type: Mapped[str] = mapped_column(
        Enum(
            *[card_type.value for card_type in ReviewCardType], name="review_card_type"
        ),
        nullable=False,
    )
    prompt: Mapped[str] = mapped_column(Text, nullable=False, server_default="")
    answer: Mapped[str] = mapped_column(Text, nullable=False, server_default="")

    fsrs_state_id: Mapped[int | None] = mapped_column(
        BigInteger, ForeignKey("fsrs_states.id", ondelete="SET NULL"), unique=True
    )

    topic: Mapped["Topic"] = relationship("Topic", back_populates="review_cards")
    fsrs_state: Mapped["FsrsState | None"] = relationship("FsrsState", lazy="joined")
    reviews: Mapped[list["Review"]] = relationship(
        back_populates="review_card",
        passive_deletes=True,
        foreign_keys="Review.review_card_id",
    )
    type_assignments: Mapped[list["ReviewCardTypeAssignment"]] = relationship(
        back_populates="review_card",
        passive_deletes=True,
    )

    @property
    def topic_title(self) -> str:
        return self.topic.title if self.topic else ""

    @property
    def last_review_rating(self) -> str | None:
        latest_completed = None

        for review in self.reviews:
            if review.completed_at is None:
                continue
            if latest_completed is None:
                latest_completed = review
                continue
            if review.completed_at > latest_completed.completed_at:
                latest_completed = review
                continue
            if (
                review.completed_at == latest_completed.completed_at
                and review.updated_at > latest_completed.updated_at
            ):
                latest_completed = review

        return latest_completed.rating if latest_completed else None

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
        return compute_distance_to_retrievability(
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
    def last_reviewed_at(self) -> date | None:
        return self.fsrs_state.last_reviewed_at if self.fsrs_state else None

    @property
    def srs_enabled(self) -> bool:
        return self.fsrs_state.srs_enabled if self.fsrs_state else False

    @property
    def is_new(self) -> bool:
        return self.last_reviewed_at is None

    @property
    def status_badges(self) -> list[dict[str, str | int | None]]:
        return build_review_card_status_badges(self)


class ReviewCardTypeAssignment(Base):
    __tablename__ = "review_card_types"

    review_card_id: Mapped[int] = mapped_column(
        BigInteger,
        ForeignKey("review_cards.id", ondelete="CASCADE"),
        primary_key=True,
    )
    type: Mapped[str] = mapped_column(
        Enum(
            *[card_type.value for card_type in ReviewCardType], name="review_card_type"
        ),
        primary_key=True,
    )
    inserted_at: Mapped[datetime] = mapped_column(
        TIMESTAMP(timezone=True),
        nullable=False,
        server_default=text("timezone('utc'::text, now())"),
    )

    review_card: Mapped["ReviewCard"] = relationship(back_populates="type_assignments")
