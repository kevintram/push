"""FastAPI exception handlers that translate domain exceptions to HTTP responses.

Note: We only need handlers for base classes. Subclasses (CycleDetectedError,
AlreadyExistsError, etc.) inherit the handler from their parent class.
"""

import logging

from fastapi import Request, status
from fastapi.responses import JSONResponse

from app.auth.session import clear_auth_cookies
from app.config import get_settings
from app.exceptions import (
    AuthenticationError,
    BadRequestError,
    ConflictError,
    DomainError,
    ForbiddenError,
    NotFoundError,
)

logger = logging.getLogger(__name__)


def _json_error_response(
    request: Request, *, status_code: int, detail: str
) -> JSONResponse:
    response = JSONResponse(
        status_code=status_code,
        content={"detail": detail},
    )
    origin = request.headers.get("origin")
    allowed_origins = set(get_settings().CORS_ALLOWED_ORIGINS_AS_STRINGS)
    if origin and origin in allowed_origins:
        response.headers["Access-Control-Allow-Origin"] = origin
        response.headers["Access-Control-Allow-Credentials"] = "true"
        response.headers["Vary"] = "Origin"
    return response


async def not_found_handler(request: Request, exc: NotFoundError) -> JSONResponse:
    return _json_error_response(
        request,
        status_code=status.HTTP_404_NOT_FOUND,
        detail=str(exc),
    )


async def conflict_handler(request: Request, exc: ConflictError) -> JSONResponse:
    return _json_error_response(
        request,
        status_code=status.HTTP_409_CONFLICT,
        detail=exc.detail,
    )


async def bad_request_handler(request: Request, exc: BadRequestError) -> JSONResponse:
    return _json_error_response(
        request,
        status_code=status.HTTP_400_BAD_REQUEST,
        detail=exc.detail,
    )


async def authentication_handler(
    request: Request, exc: AuthenticationError
) -> JSONResponse:
    response = _json_error_response(
        request,
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail=exc.detail,
    )
    if exc.clear_auth_cookies:
        clear_auth_cookies(response)
    return response


async def forbidden_handler(request: Request, exc: ForbiddenError) -> JSONResponse:
    return _json_error_response(
        request,
        status_code=status.HTTP_403_FORBIDDEN,
        detail=exc.detail,
    )


async def domain_error_handler(request: Request, exc: DomainError) -> JSONResponse:
    """Catch-all for unhandled domain errors."""
    return _json_error_response(
        request,
        status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
        detail="An unexpected error occurred",
    )


async def unexpected_exception_handler(
    request: Request, exc: Exception
) -> JSONResponse:
    logger.exception(
        "Unhandled exception while processing %s %s",
        request.method,
        request.url.path,
        exc_info=exc,
    )
    return _json_error_response(
        request,
        status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
        detail="An unexpected error occurred",
    )


def register_exception_handlers(app):
    """Register all exception handlers with the FastAPI app.

    Order matters: register specific classes before base classes.
    FastAPI matches the first registered handler for the exception type.
    """
    # Specific handlers (registered first)
    app.add_exception_handler(NotFoundError, not_found_handler)
    app.add_exception_handler(ConflictError, conflict_handler)
    app.add_exception_handler(BadRequestError, bad_request_handler)
    app.add_exception_handler(AuthenticationError, authentication_handler)
    app.add_exception_handler(ForbiddenError, forbidden_handler)
    # Catch-all (registered last)
    app.add_exception_handler(DomainError, domain_error_handler)
    app.add_exception_handler(Exception, unexpected_exception_handler)
