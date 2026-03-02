from app.schemas.notes import (
    NoteCreate,
    NoteRead,
    NoteRelationCreate,
    NoteRelationListItem,
    NoteRelationRead,
    NoteRelationTypeEnum,
    NoteTagCreate,
    NoteTagEnum,
    NoteUpdate,
    RelationDirectionEnum,
)
from app.schemas.review_queue import ReviewQueueItem
from app.schemas.reviews import (
    NoteSummary,
    ReviewBase,
    ReviewCreate,
    ReviewListItem,
    ReviewRead,
    ReviewUpdate,
    ReviewWithNote,
)
from app.schemas.search import SearchResultItem

NoteRead.model_rebuild()
ReviewBase.model_rebuild()
ReviewRead.model_rebuild()
ReviewListItem.model_rebuild()
ReviewCreate.model_rebuild()
ReviewUpdate.model_rebuild()
ReviewWithNote.model_rebuild()
SearchResultItem.model_rebuild()
ReviewQueueItem.model_rebuild()

__all__ = [
    "NoteCreate",
    "NoteRead",
    "NoteRelationCreate",
    "NoteRelationListItem",
    "NoteRelationRead",
    "NoteRelationTypeEnum",
    "NoteTagCreate",
    "NoteTagEnum",
    "NoteUpdate",
    "RelationDirectionEnum",
    "ReviewQueueItem",
    "NoteSummary",
    "ReviewBase",
    "ReviewCreate",
    "ReviewListItem",
    "ReviewRead",
    "ReviewUpdate",
    "ReviewWithNote",
    "SearchResultItem",
]
