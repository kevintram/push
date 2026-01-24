"""FastAPI exception handlers that translate domain exceptions to HTTP responses.

Note: We only need handlers for base classes. Subclasses (CycleDetectedError,
AlreadyExistsError, etc.) inherit the handler from their parent class.
"""

from fastapi import Request, status
from fastapi.responses import JSONResponse

from app.exceptions import (
    AuthenticationError,
    BadRequestError,
    ConflictError,
    DomainError,
    ForbiddenError,
    NotFoundError,
)


async def not_found_handler(request: Request, exc: NotFoundError) -> JSONResponse:
    return JSONResponse(
        status_code=status.HTTP_404_NOT_FOUND,
        content={"detail": str(exc)},
    )


async def conflict_handler(request: Request, exc: ConflictError) -> JSONResponse:
    return JSONResponse(
        status_code=status.HTTP_409_CONFLICT,
        content={"detail": exc.detail},
    )


async def bad_request_handler(request: Request, exc: BadRequestError) -> JSONResponse:
    return JSONResponse(
        status_code=status.HTTP_400_BAD_REQUEST,
        content={"detail": exc.detail},
    )


async def authentication_handler(
    request: Request, exc: AuthenticationError
) -> JSONResponse:
    return JSONResponse(
        status_code=status.HTTP_401_UNAUTHORIZED,
        content={"detail": exc.detail},
    )


async def forbidden_handler(request: Request, exc: ForbiddenError) -> JSONResponse:
    return JSONResponse(
        status_code=status.HTTP_403_FORBIDDEN,
        content={"detail": exc.detail},
    )


async def domain_error_handler(request: Request, exc: DomainError) -> JSONResponse:
    """Catch-all for unhandled domain errors."""
    return JSONResponse(
        status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
        content={"detail": "An unexpected error occurred"},
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
