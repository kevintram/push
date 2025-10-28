from app.schemas.todos import TodoBase, TodoCreate, TodoRead, TodoUpdate, TodoWithTopics
from app.schemas.topics import TopicBase, TopicRead, TopicCreate

# Rebuild models to resolve forward references
TodoWithTopics.model_rebuild()
TopicRead.model_rebuild()
TodoRead.model_rebuild()
TodoCreate.model_rebuild()
TodoUpdate.model_rebuild()

__all__ = [
    "TodoBase",
    "TodoCreate",
    "TodoRead",
    "TodoUpdate",
    "TodoWithTopics",
    "TopicBase",
    "TopicRead",
    "TopicCreate"
]
