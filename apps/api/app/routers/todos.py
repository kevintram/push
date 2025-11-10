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
from app.routers.reviews import replay_reviews_from_date

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
    old_completed_at = old_todo.completed_at

    # Perform the update
    update_stmt = (
        update(Todo)
        .where(Todo.id == todo_id, Todo.user_id == user_id)
        .values(update_values)
    )
    result = await session.execute(update_stmt)
    if result.rowcount == 0:
        raise HTTPException(status_code=404, detail="Todo not found")

    # check if completed_at is changing
    completed_at_changed = (
        "completed_at" in update_values
        and update_values["completed_at"] != old_completed_at
    )
    print(f"completed_at_changed: {completed_at_changed}")
    if not completed_at_changed:
        # fetch and return updated todo
        stmt = (
            select(Todo)
            .where(Todo.id == todo_id, Todo.user_id == user_id)
            .options(selectinload(Todo.reviews).selectinload(Review.topic))
        )
        final_result = await session.execute(stmt)
        return final_result.scalar_one()
    
    # since completed_at is changing, we need to update corresponding reviews
    new_completed_at = update_values.get("completed_at")
    # Case 1: Todo became completed (None → date)
    if old_completed_at is None and new_completed_at is not None:
        print("due is none -> date, so set rating -> good")
        # Set all null ratings to "good"
        await session.execute(
            update(Review)
            .where(
                Review.todo_id == todo_id,
                Review.user_id == user_id,
                Review.rating.is_(None)
            )
            .values(rating="good")
        )
        await session.flush()
    # Case 2: Todo became uncompleted (date → None)
    elif old_completed_at is not None and new_completed_at is None:
        print("due is date -> none, so set rating -> none")
        # Set all ratings back to None
        await session.execute(
            update(Review)
            .where(Review.todo_id == todo_id, Review.user_id == user_id)
            .values(rating=None)
        )
        await session.flush()
    
    # Run FSRS for all affected topics, starting from earliest affected date
    if completed_at_changed:
        replay_from_date = None
        if old_completed_at is not None and new_completed_at is not None:
            replay_from_date = min(old_completed_at, new_completed_at)
        elif old_completed_at is not None:
            replay_from_date = old_completed_at
        elif new_completed_at is not None:
            replay_from_date = new_completed_at

        if replay_from_date:
            reviews_result = await session.execute(
                select(Review.topic_id)
                .where(Review.todo_id == todo_id, Review.user_id == user_id)
                .distinct()
            )
            affected_topic_ids = {row[0] for row in reviews_result.all()}

            for topic_id in affected_topic_ids:
                await replay_reviews_from_date(
                    session=session,
                    topic_id=topic_id,
                    user_id=user_id,
                    from_date=replay_from_date,
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
    # Fetch the todo to check if it has a completion date
    todo_result = await session.execute(
        select(Todo).where(Todo.id == todo_id, Todo.user_id == user_id)
    )
    todo = todo_result.scalar_one_or_none()

    if not todo:
        raise HTTPException(status_code=404, detail="Todo not found")

    completed_at = todo.completed_at

    # Fetch all reviews associated with this todo to get affected topic IDs
    reviews_result = await session.execute(
        select(Review.topic_id)
        .where(Review.todo_id == todo_id, Review.user_id == user_id)
        .distinct()
    )
    affected_topic_ids = {row[0] for row in reviews_result.all()}

    # Delete the todo (reviews will be cascade deleted if DB is configured that way)
    stmt = delete(Todo).where(Todo.id == todo_id, Todo.user_id == user_id)
    await session.execute(stmt)

    # Only replay if the todo was completed (had a completion date)
    if completed_at and affected_topic_ids:
        for topic_id in affected_topic_ids:
            await replay_reviews_from_date(
                session=session,
                topic_id=topic_id,
                user_id=user_id,
                from_date=completed_at,
            )

    return {"message": "Todo deleted successfully"}
