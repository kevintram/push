from app.schemas.todos import TodoBase, TodoCreate, TodoRead, TodoUpdate, TodoWithTopics
from app.schemas.topics import TopicsBase, TopicsWithTodosPublic

# Rebuild models to resolve forward references
TodoWithTopics.model_rebuild()
TopicsWithTodosPublic.model_rebuild()
TodoRead.model_rebuild()
TodoCreate.model_rebuild()
TodoUpdate.model_rebuild()

__all__ = [
    "TodoBase",
    "TodoCreate",
    "TodoRead",
    "TodoUpdate",
    "TodoWithTopics",
    "TopicsBase",
    "TopicsWithTodosPublic",
]
