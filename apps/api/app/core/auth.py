from functools import lru_cache

from workos import WorkOSClient

from app.config import get_settings


@lru_cache
def get_workos() -> WorkOSClient:
    settings = get_settings()
    return WorkOSClient(
        api_key=settings.WORKOS_API_KEY, client_id=settings.WORKOS_CLIENT_ID
    )
