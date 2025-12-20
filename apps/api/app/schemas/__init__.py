from app.schemas.review_sessions import (
    ReviewSessionBase,
    ReviewSessionCreate,
    ReviewSessionRead,
    ReviewSessionUpdate,
    TopicIdPayload,
    ReviewSessionReadWithReviews,
)
from app.schemas.topics import (
    TopicRead,
    TopicCreate,
    TopicUpdate,
    TopicReadWithRelationships,
    TopicChildRelationshipCreate,
    TopicParentRelationshipCreate,
    TopicRelationshipResponse,
    TopicOtherRelationshipCreate,
    TopicOtherRelationshipResponse,
    TopicRelatedRead,
    RelationshipDirection,
)
from app.schemas.reviews import (
    ReviewBase,
    ReviewRead,
    ReviewListItem,
    ReviewSessionSummary,
    TopicSummary,
    ReviewWithTopic,
    ReviewCreate,
    ReviewUpdate,
)

# Rebuild models to resolve forward references
ReviewSessionReadWithReviews.model_rebuild()
TopicRead.model_rebuild()
TopicReadWithRelationships.model_rebuild()
ReviewSessionRead.model_rebuild()
ReviewSessionCreate.model_rebuild()
ReviewSessionUpdate.model_rebuild()
ReviewBase.model_rebuild()
ReviewRead.model_rebuild()
ReviewListItem.model_rebuild()
ReviewSessionSummary.model_rebuild()
TopicSummary.model_rebuild()
ReviewWithTopic.model_rebuild()
ReviewCreate.model_rebuild()
ReviewUpdate.model_rebuild()
TopicRelatedRead.model_rebuild()

__all__ = [
    "ReviewSessionBase",
    "ReviewSessionCreate",
    "ReviewSessionRead",
    "ReviewSessionUpdate",
    "TopicIdPayload",
    "TopicRead",
    "TopicCreate",
    "TopicChildRelationshipCreate",
    "TopicParentRelationshipCreate",
    "TopicRelationshipResponse",
    "TopicOtherRelationshipCreate",
    "TopicOtherRelationshipResponse",
    "TopicUpdate",
    "TopicReadWithRelationships",
    "ReviewSessionReadWithReviews",
    "ReviewBase",
    "ReviewRead",
    "ReviewListItem",
    "ReviewSessionSummary",
    "TopicSummary",
    "ReviewWithTopic",
    "ReviewCreate",
    "ReviewUpdate",
    "TopicRelatedRead",
    "RelationshipDirection",
]
