"""Practices HTTP endpoints - thin wrapper around service layer."""

from typing import Literal

from fastapi import APIRouter

from app.auth.dependencies import UserIdDep
from app.dependencies import SessionDep
from app.schemas import (
    ConvertPracticeToSourceResponse,
    ConvertPracticeToTopicResponse,
    PracticeCreate,
    PracticeDetailRead,
    PracticeSummaryRead,
    PracticeSourceAdd,
    PracticeSourceResponse,
    PracticeTopicAdd,
    PracticeTopicResponse,
    PracticeUpdate,
    SourceSummaryRead,
    TopicSummaryRead,
)
from app.practices import service

router = APIRouter(prefix="/practices", tags=["practices"])


@router.get("/search/")
async def search_practices(
    session: SessionDep,
    user_id: UserIdDep,
    query: str | None = None,
    limit: int = 10,
) -> list[PracticeSummaryRead]:
    return await service.search_practices(session, user_id, query=query, limit=limit)


@router.get("/")
async def read_practices(
    session: SessionDep,
    user_id: UserIdDep,
    inboxed: bool | None = None,
    archived: bool | None = None,
    has_stability: bool | None = None,
    srs_enabled: bool | None = None,
    limit: int | None = None,
    order: Literal["asc", "desc"] = "desc",
) -> list[PracticeSummaryRead]:
    return await service.list_practices(
        session,
        user_id,
        inboxed=inboxed,
        archived=archived,
        has_stability=has_stability,
        srs_enabled=srs_enabled,
        limit=limit,
        order=order,
    )


@router.get("/{practice_id}/")
async def read_practice(
    session: SessionDep, user_id: UserIdDep, practice_id: int
) -> PracticeDetailRead:
    return await service.load_practice_with_relationships(session, practice_id, user_id)


@router.get("/{practice_id}/topics/")
async def read_practice_topics(
    session: SessionDep, user_id: UserIdDep, practice_id: int
) -> list[TopicSummaryRead]:
    return await service.get_practice_topics(session, practice_id, user_id)


@router.get("/{practice_id}/sources/")
async def read_practice_sources(
    session: SessionDep, user_id: UserIdDep, practice_id: int
) -> list[SourceSummaryRead]:
    return await service.get_practice_sources(session, practice_id, user_id)


@router.post("/")
async def insert_practice(
    practice: PracticeCreate, session: SessionDep, user_id: UserIdDep
) -> PracticeSummaryRead:
    practice_data = practice.model_dump()
    return await service.create_practice(session, user_id, **practice_data)


@router.post("/{practice_id}/topics/")
async def add_practice_topic(
    practice_id: int,
    payload: PracticeTopicAdd,
    session: SessionDep,
    user_id: UserIdDep,
) -> PracticeTopicResponse:
    if payload.topic_id is not None:
        practice, topic = await service.add_practice_topic(
            session, practice_id, user_id, topic_id=payload.topic_id
        )
    else:
        practice, topic = await service.add_practice_topic(
            session, practice_id, user_id, topic_data=payload.topic.model_dump()
        )
    return PracticeTopicResponse(practice=practice, topic=topic)


@router.delete("/{practice_id}/topics/{topic_id}/", status_code=204)
async def remove_practice_topic(
    practice_id: int,
    topic_id: int,
    session: SessionDep,
    user_id: UserIdDep,
) -> None:
    await service.remove_practice_topic(session, practice_id, topic_id, user_id)


@router.post("/{practice_id}/sources/")
async def add_practice_source(
    practice_id: int,
    payload: PracticeSourceAdd,
    session: SessionDep,
    user_id: UserIdDep,
) -> PracticeSourceResponse:
    if payload.source_id is not None:
        practice, source = await service.add_practice_source(
            session, practice_id, user_id, source_id=payload.source_id
        )
    else:
        practice, source = await service.add_practice_source(
            session, practice_id, user_id, source_data=payload.source.model_dump()
        )
    return PracticeSourceResponse(practice=practice, source=source)


@router.delete("/{practice_id}/sources/{source_id}/", status_code=204)
async def remove_practice_source(
    practice_id: int,
    source_id: int,
    session: SessionDep,
    user_id: UserIdDep,
) -> None:
    await service.remove_practice_source(session, practice_id, source_id, user_id)


@router.post("/{practice_id}/convert-to-topic/")
async def convert_practice_to_topic_endpoint(
    practice_id: int, session: SessionDep, user_id: UserIdDep
) -> ConvertPracticeToTopicResponse:
    """Convert a practice to a topic."""
    new_topic_id = await service.convert_practice_to_topic(
        session, practice_id, user_id
    )
    return ConvertPracticeToTopicResponse(topic_id=new_topic_id)


@router.post("/{practice_id}/convert-to-source/")
async def convert_practice_to_source_endpoint(
    practice_id: int, session: SessionDep, user_id: UserIdDep
) -> ConvertPracticeToSourceResponse:
    """Convert a practice to a source."""
    new_source_id = await service.convert_practice_to_source(
        session, practice_id, user_id
    )
    return ConvertPracticeToSourceResponse(source_id=new_source_id)


@router.patch("/{practice_id}/")
async def update_practice(
    practice_id: int, payload: PracticeUpdate, session: SessionDep, user_id: UserIdDep
) -> PracticeDetailRead:
    update_data = payload.model_dump(exclude_unset=True)

    # Convert to service function kwargs
    kwargs = {}
    if "prompt" in update_data:
        kwargs["prompt"] = update_data["prompt"]
    if "answer" in update_data:
        kwargs["answer"] = update_data["answer"]
    if "srs_enabled" in update_data:
        kwargs["srs_enabled"] = update_data["srs_enabled"]
    if "inboxed" in update_data:
        kwargs["inboxed"] = update_data["inboxed"]
    if "archived" in update_data:
        kwargs["archived"] = update_data["archived"]

    return await service.update_practice(session, practice_id, user_id, **kwargs)


@router.delete("/{practice_id}/", status_code=204)
async def delete_practice(
    practice_id: int,
    session: SessionDep,
    user_id: UserIdDep,
):
    await service.delete_practice(session, practice_id, user_id)
