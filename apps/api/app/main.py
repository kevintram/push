from fastapi import Depends, FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from starlette.middleware.base import BaseHTTPMiddleware

from app.config import get_settings
from app.exception_handlers import register_exception_handlers
from app.admin.dependencies import get_token_header
from app.reviews.router import router as reviews_router
from app.review_queue.router import router as review_queue_router
from app.auth.router import router as auth_router
from app.admin.router import router as admin_router
from app.search.router import router as search_router
from app.review_cards.router import router as review_cards_router
from app.topics.router import router as topics_router
from app.utils.current_date import (
    parse_iso_date,
    reset_request_current_date,
    set_request_current_date,
)

app = FastAPI()

register_exception_handlers(app)


async def apply_client_date_header(request: Request, call_next):
    client_date = parse_iso_date(request.headers.get("X-Client-Date"))
    token = set_request_current_date(client_date)
    try:
        return await call_next(request)
    finally:
        reset_request_current_date(token)


app.add_middleware(
    BaseHTTPMiddleware,
    dispatch=apply_client_date_header,
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=get_settings().CORS_ALLOWED_ORIGINS_AS_STRINGS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


app.include_router(reviews_router)
app.include_router(review_queue_router)
app.include_router(search_router)
app.include_router(topics_router)
app.include_router(review_cards_router)
app.include_router(auth_router)
app.include_router(
    admin_router,
    prefix="/admin",
    tags=["admin"],
    dependencies=[Depends(get_token_header)],
)


@app.get("/")
async def root():
    return {"message": "Hello Bigger Applications!"}
