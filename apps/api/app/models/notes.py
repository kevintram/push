from __future__ import annotations

from datetime import date, datetime
from enum import Enum as PyEnum
from typing import TYPE_CHECKING

from sqlalchemy import (
    BigInteger,
    Enum,
    ForeignKey,
    Identity,
    String,
    UniqueConstraint,
    text,
)
from sqlalchemy.ext.hybrid import hybrid_property
from sqlalchemy.orm import Mapped, mapped_column, relationship
from sqlalchemy.types import TIMESTAMP, Boolean, Text

from app.models.base import Base
from app.notes.status_badges import build_note_status_badges
from app.types.ltree import LtreeType
from app.utils.retrievability import (
    calculate_days_in_current_tier,
    calculate_days_until_threshold,
    calculate_retrievability,
    get_freshness_tier,
    get_next_tier_threshold,
)

if TYPE_CHECKING:
    from app.models.fsrs_state import FsrsState
    from app.models.reviews import Review


class NoteTagType(str, PyEnum):
    TOPIC = "TOPIC"
    SOURCE = "SOURCE"
    PRACTICE = "PRACTICE"


class ReadingStatus(str, PyEnum):
    NEW = "NEW"
    IN_PROGRESS = "IN_PROGRESS"
    ON_HOLD = "ON_HOLD"
    FINISHED = "FINISHED"


class NoteRelationType(str, PyEnum):
    RELATED = "RELATED"
    PREREQUISITE = "PREREQUISITE"
    COVERS = "COVERS"
    ASSESSES = "ASSESSES"


class Note(Base):
    __tablename__ = "notes"

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
        BigInteger, ForeignKey("notes.id", ondelete="RESTRICT"), nullable=True
    )
    path: Mapped[str | None] = mapped_column(LtreeType(), nullable=True)

    fsrs_state_id: Mapped[int | None] = mapped_column(
        BigInteger, ForeignKey("fsrs_states.id", ondelete="SET NULL"), unique=True
    )

    reading_status: Mapped[str] = mapped_column(
        Enum(*[status.value for status in ReadingStatus], name="reading_status"),
        nullable=False,
        server_default=text("'NEW'::reading_status"),
    )
    reading_notes: Mapped[str] = mapped_column(Text, nullable=False, server_default="")
    in_reading_list: Mapped[bool] = mapped_column(
        Boolean, nullable=False, server_default=text("false")
    )

    archived: Mapped[bool] = mapped_column(
        Boolean, nullable=False, server_default=text("false")
    )
    inboxed: Mapped[bool] = mapped_column(
        Boolean, nullable=False, server_default=text("false")
    )

    parent: Mapped["Note | None"] = relationship(
        "Note",
        remote_side="Note.id",
        back_populates="children",
        foreign_keys=[parent_id],
    )
    children: Mapped[list["Note"]] = relationship(
        "Note", back_populates="parent", foreign_keys=[parent_id]
    )

    fsrs_state: Mapped["FsrsState | None"] = relationship("FsrsState", lazy="joined")

    tag_assignments: Mapped[list["NoteTag"]] = relationship(
        "NoteTag",
        back_populates="note",
        cascade="all, delete-orphan",
        passive_deletes=True,
    )
    outgoing_relations: Mapped[list["NoteRelation"]] = relationship(
        "NoteRelation",
        back_populates="from_note",
        foreign_keys="NoteRelation.from_id",
        cascade="all, delete-orphan",
        passive_deletes=True,
    )
    incoming_relations: Mapped[list["NoteRelation"]] = relationship(
        "NoteRelation",
        back_populates="to_note",
        foreign_keys="NoteRelation.to_id",
        cascade="all, delete-orphan",
        passive_deletes=True,
    )
    reviews: Mapped[list["Review"]] = relationship(
        back_populates="note",
        passive_deletes=True,
    )

    @property
    def tags(self) -> list[str]:
        return [assignment.tag for assignment in self.tag_assignments]

    @property
    def parent_title(self) -> str | None:
        return self.parent.title if self.parent else None

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
    def status_badges(self) -> list[dict[str, str | int | None]]:
        return build_note_status_badges(self)


class NoteTag(Base):
    __tablename__ = "note_tags"

    note_id: Mapped[int] = mapped_column(
        BigInteger, ForeignKey("notes.id", ondelete="CASCADE"), primary_key=True
    )
    tag: Mapped[str] = mapped_column(
        Enum(*[tag.value for tag in NoteTagType], name="note_tag"),
        primary_key=True,
    )
    inserted_at: Mapped[datetime] = mapped_column(
        TIMESTAMP(timezone=True),
        nullable=False,
        server_default=text("timezone('utc'::text, now())"),
    )

    note: Mapped["Note"] = relationship("Note", back_populates="tag_assignments")


class NoteRelation(Base):
    __tablename__ = "note_relations"
    __table_args__ = (
        UniqueConstraint(
            "from_id", "to_id", "relation_type", name="unique_note_relation"
        ),
    )

    id: Mapped[int] = mapped_column(BigInteger, Identity(always=True), primary_key=True)
    from_id: Mapped[int] = mapped_column(
        BigInteger, ForeignKey("notes.id", ondelete="CASCADE"), nullable=False
    )
    to_id: Mapped[int] = mapped_column(
        BigInteger, ForeignKey("notes.id", ondelete="CASCADE"), nullable=False
    )
    relation_type: Mapped[str] = mapped_column(
        Enum(*[value.value for value in NoteRelationType], name="note_relation_type"),
        nullable=False,
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

    from_note: Mapped["Note"] = relationship(
        "Note", back_populates="outgoing_relations", foreign_keys=[from_id]
    )
    to_note: Mapped["Note"] = relationship(
        "Note", back_populates="incoming_relations", foreign_keys=[to_id]
    )
