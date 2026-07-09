from fastapi import APIRouter
from app.models.schemas.upload import HealthResponse
from app.models.schemas.responses import BaseResponse
from app.core.constants import MSG_HEALTHY

router = APIRouter()

@router.get("/health", response_model=BaseResponse[HealthResponse], summary="Checks service health status")
async def health_check():
    """Checks and returns the liveness status of the backend API."""
    data = HealthResponse(status="healthy")
    return BaseResponse(
        success=True,
        message=MSG_HEALTHY,
        data=data
    )
