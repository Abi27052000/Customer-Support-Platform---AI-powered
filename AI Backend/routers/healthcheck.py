from fastapi import APIRouter
from controllers.healthcheck_controller import HealthCheckController

router = APIRouter(
    prefix="/api",
    tags=["healthcheck"]
)

controller = HealthCheckController()

@router.get("/healthcheck")
async def healthcheck():
    """
    Healthcheck endpoint to verify the API is running
    """
    return controller.check_health()
