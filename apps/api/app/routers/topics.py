from fastapi import APIRouter, HTTPException
from datetime import datetime

from sqlalchemy import or_, select, update, delete, Connection, desc
from sqlalchemy.orm import selectinload
from sqlalchemy.ext.asyncio import AsyncSession
from typing import Literal

from app.dependencies import SessionDep, UserIdDep
from app.models import Topic, t_topics_closure, Review, TopicReview
from app.schemas import (
    TopicRead,
    TopicCreate,
    TopicUpdate,
    TopicReadWithRelationshipsAndReviews,
    TopicRelationshipCreate,
    TopicParentRelationshipCreate,
    ReviewReadWithTopics,
)

router = APIRouter()


async def _insert_topic_relationship(
    session: AsyncSession,
    *,
    user_id: str,
    parent_id: int,
    child_id: int,
    focus_topic_id: int,
) -> Topic:
    if parent_id == child_id:
        raise HTTPException(status_code=400, detail="Parent and child must be different topics")

    topics_result = await session.execute(
        select(Topic.id).where(
            Topic.user_id == user_id,
            Topic.id.in_([parent_id, child_id]),
        )
    )
    topic_ids = set(topics_result.scalars())

    if parent_id not in topic_ids:
        raise HTTPException(status_code=404, detail="Parent topic not found")
    if child_id not in topic_ids:
        raise HTTPException(status_code=404, detail="Child topic not found")

    # Check if relationship already exists
    relationship_result = await session.execute(
        select(t_topics_closure.c.ancestor).where(
            t_topics_closure.c.ancestor == parent_id,
            t_topics_closure.c.descendant == child_id,
            t_topics_closure.c.depth == 1,
        )
    )
    if relationship_result.scalar_one_or_none() is not None:
        raise HTTPException(status_code=409, detail="Relationship already exists")

    conn = await session.connection()
    raw_conn = await conn.get_raw_connection()
    inserted_rows = await raw_conn.driver_connection.fetch(
        "SELECT * FROM insert_relationship($1, $2)", parent_id, child_id
    )

    if not inserted_rows:
        raise HTTPException(
            status_code=400,
            detail="Relationship already exists or would create a cycle",
        )

    refreshed_topic = await session.execute(
        select(Topic)
        .where(Topic.id == focus_topic_id, Topic.user_id == user_id)
        .options(
            selectinload(Topic.parents),
            selectinload(Topic.children),
            selectinload(Topic.reviews),
        )
    )
    topic = refreshed_topic.scalar_one_or_none()

    if not topic:
        raise HTTPException(status_code=404, detail="Topic not found")

    return topic


async def _delete_topic_relationship(
    session: AsyncSession,
    *,
    user_id: str,
    parent_id: int,
    child_id: int,
    focus_topic_id: int,
) -> Topic:
    if parent_id == child_id:
        raise HTTPException(status_code=400, detail="Parent and child must be different topics")

    topics_result = await session.execute(
        select(Topic.id).where(
            Topic.user_id == user_id,
            Topic.id.in_([parent_id, child_id]),
        )
    )
    topic_ids = set(topics_result.scalars())

    if parent_id not in topic_ids:
        raise HTTPException(status_code=404, detail="Parent topic not found")
    if child_id not in topic_ids:
        raise HTTPException(status_code=404, detail="Child topic not found")

    relationship_result = await session.execute(
        select(t_topics_closure.c.ancestor).where(
            t_topics_closure.c.ancestor == parent_id,
            t_topics_closure.c.descendant == child_id,
            t_topics_closure.c.depth == 1,
        )
    )
    relationship_exists = relationship_result.scalar_one_or_none()

    if relationship_exists is None:
        raise HTTPException(status_code=404, detail="Relationship not found")

    conn = await session.connection()

    raw_conn = await conn.get_raw_connection()
    deleted_rows = await raw_conn.driver_connection.fetch(
        "SELECT * FROM delete_relationship($1, $2)", parent_id, child_id
    )

    if not deleted_rows:
        raise HTTPException(status_code=404, detail="Relationship not found")

    refreshed_topic = await session.execute(
        select(Topic)
        .where(Topic.id == focus_topic_id, Topic.user_id == user_id)
        .options(
            selectinload(Topic.parents),
            selectinload(Topic.children),
            selectinload(Topic.reviews),
        )
    )
    topic = refreshed_topic.scalar_one_or_none()

    if not topic:
        raise HTTPException(status_code=404, detail="Topic not found")

    return topic


@router.get("/topics/search/", tags=["topics"])
async def search_topics(
    session: SessionDep,
    user_id: UserIdDep,
    addable_as_parent_to: int | None = None,
    addable_as_child_to: int | None = None,
    addable_to_review: int | None = None,
    query: str | None = None,
    limit: int = 10,
) -> list[TopicReadWithRelationshipsAndReviews]:
    cleaned_query = query.strip() if query else ""
    stmt = select(Topic).where(Topic.user_id == user_id)

    if addable_as_parent_to is not None:
        # filter out all topics that can't be parents to addable_as_parent_to   

        # 1. filter out addable_as_parent_to's descendants (if add a descendant as parent, it will create a cycle)
        descendants = select(t_topics_closure.c.descendant).where(t_topics_closure.c.ancestor == addable_as_parent_to)
        stmt = stmt.where(Topic.id.notin_(descendants))

        # 2. filter out addable_as_parent_to's parents (don't want to add a topic that's already a parent)
        parents = select(t_topics_closure.c.ancestor).where(t_topics_closure.c.descendant == addable_as_parent_to, t_topics_closure.c.depth == 1)
        stmt = stmt.where(Topic.id.notin_(parents))
    if addable_as_child_to is not None:
        # filter out all topics that can't be children to addable_as_child_to

        # 1. filter out addable_as_child_to's ancestors (if add an ancestor as child, it will create a cycle)
        ancestors = select(t_topics_closure.c.ancestor).where(t_topics_closure.c.descendant == addable_as_child_to)
        stmt = stmt.where(Topic.id.notin_(ancestors))

        # 2. filter out addable_as_child_to's children (don't want to add a topic that's already a child)
        children = select(t_topics_closure.c.descendant).where(t_topics_closure.c.ancestor == addable_as_child_to, t_topics_closure.c.depth == 1)
        stmt = stmt.where(Topic.id.notin_(children))
    if addable_to_review is not None:
        # filter out all topics that can't be added to addable_to_review
        # filter out addable_to_review's topics (don't want to add a topic that's already a topic)
        topics = select(TopicReview.topic_id).where(TopicReview.review_id == addable_to_review)
        stmt = stmt.where(Topic.id.notin_(topics))

    if cleaned_query:
        like_pattern = f"%{cleaned_query}%"
        stmt = stmt.where(
            or_(
                Topic.name.ilike(like_pattern),
                Topic.notes.ilike(like_pattern),
            )
        )
        stmt = stmt.order_by(Topic.name.asc())
    else:
        stmt = stmt.order_by(Topic.updated_at.desc())

    limit = max(1, min(limit, 50))
    stmt = stmt.limit(limit)
    stmt = stmt.options(
        selectinload(Topic.parents),
        selectinload(Topic.children),
        selectinload(Topic.reviews),
    )

    result = await session.execute(stmt)
    return result.scalars().all()


@router.get("/topics/", tags=["topics"])
async def read_topics(
    session: SessionDep,
    user_id: UserIdDep,
    inboxed: bool | None = None,
    archived: bool | None = None,
    root: bool | None = None,
    due_before: str | None = None,
    due_after: str | None = None,
    limit: int | None = None,
    order: Literal["asc", "desc"] = "desc",
) -> list[TopicReadWithRelationshipsAndReviews]:
    stmt = select(Topic).where(Topic.user_id == user_id)

    # Apply ordering
    if order == "desc":
        stmt = stmt.order_by(desc(Topic.updated_at))
    else:
        stmt = stmt.order_by(Topic.updated_at)
    if inboxed is not None:
        stmt = stmt.where(Topic.inboxed == inboxed)
    if archived is not None:
        stmt = stmt.where(Topic.archived == archived)

    if root is not None and root is True:
        topics_with_ancestors = select(t_topics_closure.c.descendant).where(t_topics_closure.c.depth > 0)
        stmt = stmt.where(Topic.id.notin_(topics_with_ancestors))

    if due_before is not None:
        date_before = datetime.strptime(due_before, '%Y-%m-%d').date()
        stmt = stmt.where(Topic.due < date_before)

    if due_after is not None:
        date_after = datetime.strptime(due_after, '%Y-%m-%d').date()
        stmt = stmt.where(Topic.due >= date_after)

    stmt = stmt.options(selectinload(Topic.parents), selectinload(Topic.children), selectinload(Topic.reviews))

    # Apply limit if provided
    if limit is not None:
        stmt = stmt.limit(limit)

    result = await session.execute(stmt)
    return result.scalars().all()


@router.get("/topics/{topic_id}/", tags=["topics"])
async def read_topic(
    session: SessionDep,
    user_id: UserIdDep,
    topic_id: int
) -> TopicReadWithRelationshipsAndReviews:
    stmt = select(Topic).where(Topic.id == topic_id, Topic.user_id == user_id)
    stmt = stmt.options(selectinload(Topic.parents), selectinload(Topic.children), selectinload(Topic.reviews))
    result = await session.execute(stmt)

    topic = result.scalar_one_or_none()
    if not topic:
        raise HTTPException(status_code=404, detail="Topic not found")

    return topic


@router.get("/topics/{topic_id}/parents/", tags=["topics"])
async def read_topic_parents(
    session: SessionDep,
    user_id: UserIdDep,
    topic_id: int
) -> list[TopicReadWithRelationshipsAndReviews]:
    stmt = select(Topic).where(Topic.id == topic_id, Topic.user_id == user_id)
    stmt = stmt.options(
        selectinload(Topic.parents).selectinload(Topic.parents),
        selectinload(Topic.parents).selectinload(Topic.children),
        selectinload(Topic.parents).selectinload(Topic.reviews)
    )
    result = await session.execute(stmt)
    topic = result.scalar_one_or_none()

    if not topic:
        raise HTTPException(status_code=404, detail="Topic not found")

    return topic.parents


@router.get("/topics/{topic_id}/children/", tags=["topics"])
async def read_topic_children(
    session: SessionDep,
    user_id: UserIdDep,
    topic_id: int
) -> list[TopicReadWithRelationshipsAndReviews]:
    stmt = select(Topic).where(Topic.id == topic_id, Topic.user_id == user_id)
    stmt = stmt.options(
        selectinload(Topic.children).selectinload(Topic.parents),
        selectinload(Topic.children).selectinload(Topic.children),
        selectinload(Topic.children).selectinload(Topic.reviews)
    )
    result = await session.execute(stmt)
    topic = result.scalar_one_or_none()

    if not topic:
        raise HTTPException(status_code=404, detail="Topic not found")

    return topic.children 


@router.post("/topics/", tags=["topics"])
async def insert_topic(
    topic: TopicCreate,
    session: SessionDep,
    user_id: UserIdDep
) -> TopicRead:
    new_topic = Topic(**topic.model_dump(), user_id=user_id)

    session.add(new_topic)
    await session.flush()
    await session.refresh(new_topic, ["reviews"])

    return new_topic

@router.post("/topics/{parent_id}/children/", tags=["topics"])
async def insert_child(
    parent_id: int,
    payload: TopicRelationshipCreate,
    session: SessionDep,
    user_id: UserIdDep
) -> TopicReadWithRelationshipsAndReviews:
    child_id = payload.child_id
    return await _insert_topic_relationship(
        session,
        user_id=user_id,
        parent_id=parent_id,
        child_id=child_id,
        focus_topic_id=parent_id,
    )


@router.post("/topics/{child_id}/parents/", tags=["topics"])
async def insert_parent(
    child_id: int,
    payload: TopicParentRelationshipCreate,
    session: SessionDep,
    user_id: UserIdDep,
) -> TopicReadWithRelationshipsAndReviews:
    parent_id = payload.parent_id
    return await _insert_topic_relationship(
        session,
        user_id=user_id,
        parent_id=parent_id,
        child_id=child_id,
        focus_topic_id=child_id,
    )


@router.delete("/topics/{parent_id}/children/{child_id}/", tags=["topics"])
async def delete_child(
    parent_id: int,
    child_id: int,
    session: SessionDep,
    user_id: UserIdDep,
) -> TopicReadWithRelationshipsAndReviews:
    return await _delete_topic_relationship(
        session,
        user_id=user_id,
        parent_id=parent_id,
        child_id=child_id,
        focus_topic_id=parent_id,
    )


@router.delete("/topics/{child_id}/parents/{parent_id}/", tags=["topics"])
async def delete_parent(
    child_id: int,
    parent_id: int,
    session: SessionDep,
    user_id: UserIdDep,
) -> TopicReadWithRelationshipsAndReviews:
    return await _delete_topic_relationship(
        session,
        user_id=user_id,
        parent_id=parent_id,
        child_id=child_id,
        focus_topic_id=child_id,
    )

@router.get("/topics/{topic_id}/reviews/", tags=["topics"])
async def read_reviews_for_topic(
    topic_id: int,
    session: SessionDep,
    user_id: UserIdDep,
) -> list[ReviewReadWithTopics]:
    stmt = select(Review).where(Review.topics.any(Topic.id == topic_id), Review.user_id == user_id)
    stmt = stmt.options(selectinload(Review.topics))
    result = await session.execute(stmt)
    return result.scalars().all()

@router.post("/topics/{topic_id}/", tags=["topics"])
async def update_topic(
    topic_id: int,
    topic: TopicUpdate,
    session: SessionDep,
    user_id: UserIdDep
) -> TopicRead:
    update_values = topic.model_dump(exclude_unset=True)

    if update_values:
        stmt = (
            update(Topic)
            .where(Topic.id == topic_id, Topic.user_id == user_id)
            .values(update_values)
        )
        result = await session.execute(stmt)

        if result.rowcount == 0:
            raise HTTPException(status_code=404, detail="Topic not found")

    # Fetch and return updated topic
    select_stmt = select(Topic).where(Topic.id == topic_id, Topic.user_id == user_id)
    result = await session.execute(select_stmt)
    return result.scalar_one()

@router.delete("/topics/{topic_id}/", tags=["topics"])
async def delete_topic(
    topic_id: int,
    session: SessionDep,
    user_id: UserIdDep
):
    stmt = (
        delete(Topic)
        .where(Topic.id == topic_id, Topic.user_id == user_id)
        .returning(Topic)
    )
    result = await session.execute(stmt)
    deleted_topic = result.scalar_one_or_none()

    if not deleted_topic:
        raise HTTPException(status_code=404, detail="Topic not found")
