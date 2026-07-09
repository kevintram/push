from app.schemas.review_cards import (
    ReviewCardCreate,
    ReviewCardQueueItem,
    ReviewCardReviewCreate,
    ReviewCardRead,
    ReviewCardTypeEnum,
    ReviewCardUpdate,
)
from app.schemas.reviews import (
    ReviewBase,
    ReviewCardSummary,
    ReviewCreate,
    ReviewListItem,
    ReviewRead,
    ReviewUpdate,
    ReviewWithCard,
)
from app.schemas.search import SearchResultItem
from app.schemas.topics import TopicCreate, TopicRead, TopicUpdate

ReviewBase.model_rebuild()
ReviewRead.model_rebuild()
ReviewListItem.model_rebuild()
ReviewCreate.model_rebuild()
ReviewUpdate.model_rebuild()
ReviewWithCard.model_rebuild()
SearchResultItem.model_rebuild()
ReviewCardRead.model_rebuild()
ReviewCardQueueItem.model_rebuild()

__all__ = [
    "ReviewCardCreate",
    "ReviewCardQueueItem",
    "ReviewCardReviewCreate",
    "ReviewCardRead",
    "ReviewCardTypeEnum",
    "ReviewCardUpdate",
    "ReviewBase",
    "ReviewCardSummary",
    "ReviewCreate",
    "ReviewListItem",
    "ReviewRead",
    "ReviewUpdate",
    "ReviewWithCard",
    "SearchResultItem",
    "TopicCreate",
    "TopicRead",
    "TopicUpdate",
]
