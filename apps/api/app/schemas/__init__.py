from app.schemas.todos import (
    TodoBase,
    TodoCreate,
    TodoRead,
    TodoUpdate,
    TodoWithTopics,
    TopicIdPayload,
    TodoReadWithTopics,
    TodoReadWithReviews,
)
from app.schemas.topics import (
    TopicBase,
    TopicRead,
    TopicCreate,
    TopicReadWithRelationships,
    TopicReadWithRelationshipsAndTodos,
    TopicRelationshipCreate,
    TopicParentRelationshipCreate,
    TodoIdPayload,
    TopicUpdate,
    TopicReadWithTodos,
)
from app.schemas.reviews import (
    ReviewBase,
    ReviewRead,
    ReviewWithTopic,
)

# Rebuild models to resolve forward references
TodoWithTopics.model_rebuild()
TodoReadWithTopics.model_rebuild()
TodoReadWithReviews.model_rebuild()
TopicRead.model_rebuild()
TopicReadWithRelationships.model_rebuild()
TopicReadWithRelationshipsAndTodos.model_rebuild()
TopicReadWithTodos.model_rebuild()
TodoRead.model_rebuild()
TodoCreate.model_rebuild()
TodoUpdate.model_rebuild()
ReviewBase.model_rebuild()
ReviewRead.model_rebuild()
ReviewWithTopic.model_rebuild()

__all__ = [
    "TodoBase",
    "TodoCreate",
    "TodoRead",
    "TodoUpdate",
    "TodoWithTopics",
    "TopicIdPayload",
    "TodoReadWithTopics",
    "TopicBase",
    "TopicRead",
    "TopicCreate",
    "TopicRelationshipCreate",
    "TopicParentRelationshipCreate",
    "TodoIdPayload",
    "TopicUpdate",
    "TopicReadWithRelationships",
    "TopicReadWithRelationshipsAndTodos",
    "TopicReadWithTodos",
    "TodoReadWithReviews",
    "ReviewBase",
    "ReviewRead",
    "ReviewWithTopic",
]
