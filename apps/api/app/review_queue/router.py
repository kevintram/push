"""Review queue endpoint."""

from fastapi import APIRouter

from app.auth.dependencies import UserIdDep
from app.review_queue import service
from app.schemas.review_queue import ReviewQueueItem

router = APIRouter(prefix="/review-queue", tags=["review-queue"])


@router.get("/")
async def read_review_queue(
    user_id: UserIdDep,
    limit: int | None = None,
) -> list[ReviewQueueItem]:
    return await service.list_review_queue(user_id, limit=limit)
