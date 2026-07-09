import logging
from fastapi import FastAPI, Request
from fastapi.responses import JSONResponse
from fastapi.exceptions import RequestValidationError
from starlette.exceptions import HTTPException as StarletteHTTPException
from app.models.schemas.responses import ErrorResponse
from app.core.constants import ERROR_SERVER_EXCEPTION

logger = logging.getLogger("app.middleware.error_handler")

def register_error_handlers(app: FastAPI) -> None:
    """Registers global exception handlers for the FastAPI application."""

    @app.exception_handler(StarletteHTTPException)
    async def http_exception_handler(request: Request, exc: StarletteHTTPException) -> JSONResponse:
        logger.warning(f"HTTP exception occurred: Status {exc.status_code} - {exc.detail}")
        return JSONResponse(
            status_code=exc.status_code,
            content=ErrorResponse(success=False, message=exc.detail).model_dump()
        )

    @app.exception_handler(RequestValidationError)
    async def validation_exception_handler(request: Request, exc: RequestValidationError) -> JSONResponse:
        error_details = []
        for error in exc.errors():
            loc = " -> ".join(str(l) for l in error.get("loc", []))
            msg = error.get("msg", "Validation error")
            error_details.append(f"[{loc}]: {msg}")
        
        message = "Validation failed: " + "; ".join(error_details)
        logger.warning(f"Validation error: {message}")
        
        return JSONResponse(
            status_code=422,
            content=ErrorResponse(success=False, message=message).model_dump()
        )

    @app.exception_handler(Exception)
    async def unhandled_exception_handler(request: Request, exc: Exception) -> JSONResponse:
        logger.error("Unhandled exception encountered", exc_info=exc)
        return JSONResponse(
            status_code=500,
            content=ErrorResponse(success=False, message=ERROR_SERVER_EXCEPTION).model_dump()
        )
