from __future__ import annotations

from datetime import datetime, date

from pydantic import BaseModel, ConfigDict

from sqlalchemy import BigInteger, String, Date, Identity, Table, text, Column, ForeignKey
from sqlalchemy.types import TIMESTAMP, Text, Numeric, Integer, Boolean
from sqlalchemy.orm import relationship
from sqlalchemy.orm import declarative_base, mapped_column, Mapped

Base = declarative_base()

todos_topic_table = Table(
    "todos_topics",
    Base.metadata,
    Column("todo_id", BigInteger, ForeignKey("todos.id"), primary_key=True),
    Column("topic_id", BigInteger, ForeignKey("topics.id"), primary_key=True),
    Column("inserted_at", TIMESTAMP(timezone=True), nullable=False, server_default=text("timezone('utc'::text, now())")),
    Column("updated_at", TIMESTAMP(timezone=True), nullable=False, server_default=text("timezone('utc'::text, now())")),
    Column("user_id", String, nullable=False),
)

class TodosTable(Base):
    __tablename__ = "todos"

    id: Mapped[int] = mapped_column(BigInteger, Identity(always=True), primary_key=True)
    description: Mapped[str] = mapped_column(Text, nullable=False, default="")
    scheduled_at: Mapped[date] = mapped_column(Date)
    completed_at: Mapped[date] = mapped_column(Date)
    inserted_at: Mapped[datetime] = mapped_column(TIMESTAMP(timezone=True), nullable=False, server_default=text("timezone('utc'::text, now())"))
    updated_at: Mapped[datetime] = mapped_column(TIMESTAMP(timezone=True), nullable=False, server_default=text("timezone('utc'::text, now())"))
    user_id: Mapped[str] = mapped_column(String, nullable=False)
    topics: Mapped[list[TopicsTable]] = relationship(secondary=todos_topic_table, back_populates="todos")


class TodosPublic(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    scheduled_at: date | None
    completed_at: date | None
    inserted_at: datetime
    updated_at: datetime
    description: str
    user_id: str

class TodosWithTopicsPublic(TodosPublic):
    model_config = ConfigDict(from_attributes=True)
    topics: list[TopicsPublic]

class TopicsTable(Base):
    __tablename__ = "topics"
    
    id: Mapped[int] = mapped_column(BigInteger, Identity(always=True), primary_key=True)
    inserted_at: Mapped[datetime] = mapped_column(TIMESTAMP(timezone=True), nullable=False, server_default=text("timezone('utc'::text, now())"))
    updated_at: Mapped[datetime] = mapped_column(TIMESTAMP(timezone=True), nullable=False, server_default=text("timezone('utc'::text, now())"))
    user_id: Mapped[str] = mapped_column(String, nullable=False)
    name: Mapped[str] = mapped_column(Text, nullable=False, server_default="")
    notes: Mapped[str] = mapped_column(Text, nullable=False, server_default="")
    stability: Mapped[int] = mapped_column(Integer, nullable=False, server_default=text("1"))
    retrievability: Mapped[float] = mapped_column(Numeric(5, 4), nullable=False, server_default=text("0.0000"))
    is_archived: Mapped[bool] = mapped_column(Boolean, nullable=False, server_default=text("false"))
    is_inboxed: Mapped[bool] = mapped_column(Boolean, nullable=False, server_default=text("false"))
    todos: Mapped[list[TodosTable]] = relationship(secondary=todos_topic_table, back_populates="topics")

class TopicsPublic(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    inserted_at: datetime
    updated_at: datetime
    user_id: str
    name: str
    notes: str
    stability: int
    retrievability: float
    is_archived: bool
    is_inboxed: bool

class TopicsWithTodosPublic(TopicsPublic):
    model_config = ConfigDict(from_attributes=True)
    todos: list[TodosPublic]