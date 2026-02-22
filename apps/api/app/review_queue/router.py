"""Review queue endpoint."""

from fastapi import APIRouter, HTTPException, Query

from app.auth.dependencies import UserIdDep
from app.review_queue import service
from app.schemas.review_queue import ReviewQueuePage

router = APIRouter(prefix="/review-queue", tags=["review-queue"])


@router.get("/")
async def read_review_queue(
    user_id: UserIdDep,
    limit: int | None = Query(default=None, ge=1, le=200),
    cursor: str | None = Query(default=None),
) -> ReviewQueuePage:
    try:
        return await service.list_review_queue(user_id, limit=limit, cursor=cursor)
    except ValueError as exc:
        raise HTTPException(status_code=400, detail=str(exc)) from exc
