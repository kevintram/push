"""PostgreSQL ltree type for hierarchical tree-like data.

Based on sqlalchemy-utils LtreeType implementation:
https://github.com/kvesteri/sqlalchemy-utils/blob/master/sqlalchemy_utils/types/ltree.py

Simplified for our use case - we store paths as strings and let database
triggers compute them. We don't need the Ltree primitive wrapper.
"""

from sqlalchemy import types
from sqlalchemy.dialects.postgresql import ARRAY
from sqlalchemy.dialects.postgresql.base import ischema_names, PGTypeCompiler
from sqlalchemy.sql import expression


class LtreeType(types.Concatenable, types.UserDefinedType):
    """PostgreSQL ltree type for hierarchical tree-like data."""

    cache_ok = True

    class comparator_factory(types.Concatenable.Comparator):
        """Comparator for ltree operations."""

        def ancestor_of(self, other):
            """Test if this path is an ancestor of other (@> operator)."""
            if isinstance(other, list):
                return self.op("@>")(expression.cast(other, ARRAY(LtreeType)))
            return self.op("@>")(other)

        def descendant_of(self, other):
            """Test if this path is a descendant of other (<@ operator)."""
            if isinstance(other, list):
                return self.op("<@")(expression.cast(other, ARRAY(LtreeType)))
            return self.op("<@")(other)

    def bind_processor(self, dialect):
        def process(value):
            return value
        return process

    def result_processor(self, dialect, coltype):
        def process(value):
            return value
        return process

    def literal_processor(self, dialect):
        def process(value):
            if value:
                value = value.replace("'", "''")
                return "'%s'" % value
            return "NULL"
        return process

    __visit_name__ = "LTREE"


# Register ltree type with PostgreSQL dialect
ischema_names["ltree"] = LtreeType


def visit_LTREE(self, type_, **kw):
    return "LTREE"


PGTypeCompiler.visit_LTREE = visit_LTREE
