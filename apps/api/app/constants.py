"""Shared constants used across the application."""

from enum import Enum


class ChildHandlingStrategy(str, Enum):
    """Strategy for handling children when deleting a hierarchical entity."""

    DELETE = "delete"
    ORPHAN = "orphan"
    REPARENT = "reparent"
