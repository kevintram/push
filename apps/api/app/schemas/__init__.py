from app.schemas.todos import (
    TodoBase,
    TodoCreate,
    TodoRead,
    TodoUpdate,
    TodoWithTopics,
    TopicIdPayload,
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

# Rebuild models to resolve forward references
TodoWithTopics.model_rebuild()
TopicRead.model_rebuild()
TopicReadWithRelationships.model_rebuild()
TopicReadWithRelationshipsAndTodos.model_rebuild()
TopicReadWithTodos.model_rebuild()
TodoRead.model_rebuild()
TodoCreate.model_rebuild()
TodoUpdate.model_rebuild()

__all__ = [
    "TodoBase",
    "TodoCreate",
    "TodoRead",
    "TodoUpdate",
    "TodoWithTopics",
    "TopicIdPayload",
    "TopicBase",
    "TopicRead",
    "TopicCreate",
    "TopicRelationshipCreate",
    "TopicParentRelationshipCreate",
    "TodoIdPayload",
    "TopicUpdate",
    "TopicReadWithRelationships",
    "TopicReadWithRelationshipsAndTodos",
    "TopicReadWithTodos"
]
