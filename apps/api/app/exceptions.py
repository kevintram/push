"""Domain exception classes.

These are pure Python exceptions, NOT HTTPExceptions.
They are translated to HTTP responses by exception handlers in main.py.

Usage:
    raise NotFoundError("Note", note_id)
    raise CycleDetectedError("notes")
    raise AlreadyExistsError("Note relation already exists")
    raise SelfReferenceError("Cannot relate note to itself")
"""


class DomainError(Exception):
    """Base class for all domain exceptions."""

    pass


# --- 404 Not Found ---


class NotFoundError(DomainError):
    """Resource not found."""

    def __init__(self, resource: str, resource_id: int | str | None = None):
        self.resource = resource
        self.resource_id = resource_id
        detail = f"{resource} not found"
        if resource_id is not None:
            detail = f"{resource} with id {resource_id} not found"
        super().__init__(detail)


# --- 409 Conflict ---


class ConflictError(DomainError):
    """Base class for conflict errors (409)."""

    def __init__(self, detail: str):
        self.detail = detail
        super().__init__(detail)


class CycleDetectedError(ConflictError):
    """Adding this relationship would create a cycle."""

    def __init__(self, entity_type: str = "entity"):
        super().__init__(f"Cannot add: would create cycle in {entity_type} hierarchy")


class AlreadyExistsError(ConflictError):
    """Resource or relationship already exists."""

    def __init__(self, detail: str):
        super().__init__(detail)


class HasChildrenError(ConflictError):
    """Cannot delete entity that has children without specifying a strategy."""

    def __init__(self, entity_type: str, count: int):
        super().__init__(
            f"{entity_type} has {count} children. "
            f"Specify child_handling_strategy: 'delete', 'orphan', or 'reparent'"
        )


class HasDependentsError(ConflictError):
    """Cannot delete entity that has dependent entities."""

    def __init__(self, entity_type: str, dependent_type: str, count: int):
        super().__init__(
            f"Cannot delete {entity_type}: {count} {dependent_type}(s) depend on it"
        )


# --- 400 Bad Request ---


class BadRequestError(DomainError):
    """Base class for bad request errors (400)."""

    def __init__(self, detail: str):
        self.detail = detail
        super().__init__(detail)


class SelfReferenceError(BadRequestError):
    """Cannot create a self-referencing relationship."""

    def __init__(self, entity_type: str = "entity"):
        super().__init__(f"Cannot relate {entity_type} to itself")


class InvalidStateError(BadRequestError):
    """Operation not valid in current state."""

    def __init__(self, detail: str):
        super().__init__(detail)


# --- 401 Unauthorized ---


class AuthenticationError(DomainError):
    """Authentication failed (401)."""

    def __init__(self, detail: str = "Not authenticated"):
        self.detail = detail
        super().__init__(detail)


# --- 403 Forbidden ---


class ForbiddenError(DomainError):
    """Access denied (403)."""

    def __init__(self, detail: str = "Access denied"):
        self.detail = detail
        super().__init__(detail)
