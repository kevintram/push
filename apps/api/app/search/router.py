"""Unified search endpoint."""

from fastapi import APIRouter, Query

from app.auth.dependencies import UserIdDep
from app.schemas.search import SearchResultItem
from app.search import service

router = APIRouter(prefix="/search", tags=["search"])


@router.get("/")
async def search(
    user_id: UserIdDep,
    query: str | None = None,
    entity_types: str | None = Query(
        None, description="Comma-separated: topic,source,practice"
    ),
    inboxed: bool | None = None,
    archived: bool | None = None,
    limit: int | None = None,
) -> list[SearchResultItem]:
    parsed_types = None
    if entity_types:
        parsed_types = [t.strip() for t in entity_types.split(",")]
    return await service.search_all(
        user_id,
        query=query,
        entity_types=parsed_types,
        inboxed=inboxed,
        archived=archived,
        limit=limit,
    )
