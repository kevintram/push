from fastapi import Depends, FastAPI
from fastapi.middleware.cors import CORSMiddleware

from .dependencies import get_token_header
from .internal import admin
from .routers import topics, reviews, login, topic_reviews
from .core.config import settings

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.CORS_ALLOWED_ORIGINS_AS_STRINGS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(topics.router)
app.include_router(reviews.router)
app.include_router(topic_reviews.router)
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
