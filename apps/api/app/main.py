from fastapi import Depends, FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.config import get_settings
from app.exception_handlers import register_exception_handlers

from .dependencies import get_token_header
from .internal import admin
from .routers import login, review_entries, review_sessions, reviews
from .sources.router import router as sources_router
from .topics.router import router as topics_router

app = FastAPI()

register_exception_handlers(app)

app.add_middleware(
    CORSMiddleware,
    allow_origins=get_settings().CORS_ALLOWED_ORIGINS_AS_STRINGS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(topics_router)
app.include_router(sources_router)
app.include_router(review_sessions.router)
app.include_router(reviews.router)
app.include_router(review_entries.router)
app.include_router(login.router)
app.include_router(
    admin.router,
    prefix="/admin",
    tags=["admin"],
    dependencies=[Depends(get_token_header)],
    responses={418: {"description": "I'm a teapot"}},
)


@app.get("/")
async def root():
    return {"message": "Hello Bigger Applications!"}
