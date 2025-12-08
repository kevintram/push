from app.schemas.reviews import (
    ReviewBase,
    ReviewCreate,
    ReviewRead,
    ReviewUpdate,
    TopicIdPayload,
    ReviewReadWithTopicReviews,
)
from app.schemas.topics import (
    TopicRead,
    TopicCreate,
    TopicUpdate,
    TopicReadWithRelationships,
    TopicChildRelationshipCreate,
    TopicParentRelationshipCreate,
    TopicRelationshipResponse,
)
from app.schemas.topic_reviews import (
    TopicReviewBase,
    TopicReviewRead,
    TopicReviewWithTopic,
    TopicReviewCreate,
    TopicReviewUpdate,
)

# Rebuild models to resolve forward references
ReviewReadWithTopicReviews.model_rebuild()
TopicRead.model_rebuild()
TopicReadWithRelationships.model_rebuild()
ReviewRead.model_rebuild()
ReviewCreate.model_rebuild()
ReviewUpdate.model_rebuild()
TopicReviewBase.model_rebuild()
TopicReviewRead.model_rebuild()
TopicReviewWithTopic.model_rebuild()
TopicReviewCreate.model_rebuild()
TopicReviewUpdate.model_rebuild()
__all__ = [
    "ReviewBase",
    "ReviewCreate",
    "ReviewRead",
    "ReviewUpdate",
    "TopicIdPayload",
    "TopicBase",
    "TopicRead",
    "TopicCreate",
    "TopicChildRelationshipCreate",
    "TopicParentRelationshipCreate",
    "TopicRelationshipResponse",
    "ReviewIdPayload",
    "TopicUpdate",
    "TopicReadWithRelationships",
    "ReviewReadWithTopicReviews",
    "TopicReviewBase",
    "TopicReviewRead",
    "TopicReviewWithTopic",
    "TopicReviewCreate",
    "TopicReviewUpdate",
]
