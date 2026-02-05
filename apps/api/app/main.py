from fastapi import Depends, FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.config import get_settings
from app.exception_handlers import register_exception_handlers
from app.admin.dependencies import get_token_header
from app.topics.router import router as topics_router
from app.sources.router import router as sources_router
from app.practices.router import router as practices_router
from app.reviews.router import router as reviews_router
from app.review_queue.router import router as review_queue_router
from app.auth.router import router as auth_router
from app.admin.router import router as admin_router
from app.search.router import router as search_router

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
app.include_router(practices_router)
app.include_router(reviews_router)
app.include_router(review_queue_router)
app.include_router(search_router)
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
