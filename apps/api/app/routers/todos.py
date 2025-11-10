from fastapi import APIRouter, HTTPException
from app.dependencies import UserIdDep, SessionDep
from sqlalchemy import select, update, delete
from sqlalchemy.orm import selectinload
from app.models import Todo, Topic, Review
from app.schemas import (
    TodoCreate,
    TodoRead,
    TodoUpdate,
    TopicRead,
    TodoReadWithReviews,
)
from app.routers.reviews import replay_all_reviews_for_topic

router = APIRouter()


@router.get("/todos/", tags=["todos"])
async def read_todos(
    session: SessionDep,
    user_id: UserIdDep,
    topic_id: int | None = None,
) -> list[TodoReadWithReviews]:
    stmt = (
        select(Todo)
        .where(Todo.user_id == user_id)
        .order_by(Todo.completed_at.asc().nulls_first(), Todo.scheduled_at.asc())
        .options(selectinload(Todo.reviews).selectinload(Review.topic))
    )

    if topic_id is not None:
        stmt = stmt.where(Todo.topics.any(Topic.id == topic_id))

    result = await session.execute(stmt)
    ret = result.scalars().all()
    return ret


@router.get("/todos/{todo_id}/", tags=["todos"])
async def read_todo(
    session: SessionDep, user_id: UserIdDep, todo_id: int
) -> TodoReadWithReviews:
    stmt = select(Todo).where(Todo.id == todo_id, Todo.user_id == user_id)
    stmt = stmt.options(selectinload(Todo.reviews).selectinload(Review.topic))
    result = await session.execute(stmt)

    todo = result.scalar_one_or_none()
    if not todo:
        raise HTTPException(status_code=404, detail="Todo not found")

    return todo


@router.post("/todos/", tags=["todos"])
async def create_todo(
    todo: TodoCreate,
    session: SessionDep,
    user_id: UserIdDep,
) -> TodoRead:
    new_todo = Todo(
        description=todo.description,
        scheduled_at=todo.scheduled_at,
        completed_at=todo.completed_at,
        user_id=user_id,
    )
    session.add(new_todo)
    await session.flush()
    await session.refresh(new_todo)
    return new_todo


@router.post("/todos/{todo_id}", tags=["todos"])
async def update_todo(
    todo_id: int,
    todo: TodoUpdate,
    session: SessionDep,
    user_id: UserIdDep,
) -> TodoRead:
    update_values = todo.model_dump(exclude_unset=True, exclude={"id", "user_id"})

    if not update_values:
        raise HTTPException(status_code=400, detail="No fields to update")

    # Fetch the old todo to check if completed_at is changing
    old_todo_result = await session.execute(
        select(Todo).where(Todo.id == todo_id, Todo.user_id == user_id)
    )
    old_todo = old_todo_result.scalar_one_or_none()

    if not old_todo:
        raise HTTPException(status_code=404, detail="Todo not found")

    # Check if completed_at is changing
    completed_at_changed = (
        "completed_at" in update_values
        and update_values["completed_at"] != old_todo.completed_at
    )

    # If completed_at changed, get all affected topic IDs before the update
    affected_topic_ids = set()
    if completed_at_changed:
        reviews_result = await session.execute(
            select(Review.topic_id)
            .where(Review.todo_id == todo_id, Review.user_id == user_id)
            .distinct()
        )
        affected_topic_ids = {row[0] for row in reviews_result.all()}

    # Perform the update
    update_stmt = (
        update(Todo)
        .where(Todo.id == todo_id, Todo.user_id == user_id)
        .values(update_values)
    )
    result = await session.execute(update_stmt)

    if result.rowcount == 0:
        raise HTTPException(status_code=404, detail="Todo not found")

    # If completed_at changed, replay all affected topics
    if completed_at_changed and affected_topic_ids:
        for topic_id in affected_topic_ids:
            await replay_all_reviews_for_topic(
                session=session,
                topic_id=topic_id,
                user_id=user_id,
            )

    stmt = (
        select(Todo)
        .where(Todo.id == todo_id, Todo.user_id == user_id)
        .options(selectinload(Todo.reviews).selectinload(Review.topic))
    )
    final_result = await session.execute(stmt)
    return final_result.scalar_one()


@router.get("/todos/{todo_id}/topics/", tags=["todos"])
async def read_topics_for_todo(
    todo_id: int,
    session: SessionDep,
    user_id: UserIdDep,
) -> list[TopicRead]:
    stmt = select(Topic).where(
        Topic.todos.any(Todo.id == todo_id), Topic.user_id == user_id
    )
    result = await session.execute(stmt)
    return result.scalars().all()


@router.delete("/todos/{todo_id}", tags=["todos"])
async def delete_todo(todo_id: int, session: SessionDep, user_id: UserIdDep):
    # Fetch all reviews associated with this todo to get affected topic IDs
    reviews_result = await session.execute(
        select(Review.topic_id)
        .where(Review.todo_id == todo_id, Review.user_id == user_id)
        .distinct()
    )
    affected_topic_ids = {row[0] for row in reviews_result.all()}

    # Delete the todo (reviews will be cascade deleted if DB is configured that way)
    stmt = (
        delete(Todo).where(Todo.id == todo_id, Todo.user_id == user_id).returning(Todo)
    )
    result = await session.execute(stmt)
    deleted_todo = result.scalar_one_or_none()

    if not deleted_todo:
        raise HTTPException(status_code=404, detail="Todo not found")

    # Replay all affected topics to recalculate FSRS with remaining reviews
    if affected_topic_ids:
        for topic_id in affected_topic_ids:
            await replay_all_reviews_for_topic(
                session=session,
                topic_id=topic_id,
                user_id=user_id,
            )

    return {"message": "Todo deleted successfully"}
