from typing import Any

from fastapi import APIRouter, HTTPException
from pydantic import BaseModel, Field

from controllers.staff_performance import staff_performance_controller

router = APIRouter(
    prefix="/api/staff-performance",
    tags=["staff-performance"],
)


class StaffPerformanceRequest(BaseModel):
    staff: list[dict[str, Any]] = Field(default_factory=list)


@router.post("/evaluate")
async def evaluate_staff_performance(request: StaffPerformanceRequest):
    if not request.staff:
        return {"evaluations": []}

    try:
        return staff_performance_controller.evaluate(request.staff)
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
