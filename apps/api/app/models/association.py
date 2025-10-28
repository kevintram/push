from sqlalchemy import BigInteger, Column, ForeignKey, Table, text
from sqlalchemy.types import TIMESTAMP

from app.models.base import Base

t_todos_topics = Table(
    "todos_topics",
    Base.metadata,
    Column("todo_id", BigInteger, ForeignKey("todos.id"), primary_key=True),
    Column("topic_id", BigInteger, ForeignKey("topics.id"), primary_key=True),
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
