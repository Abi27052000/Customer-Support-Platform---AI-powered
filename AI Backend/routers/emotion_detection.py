from fastapi import APIRouter, HTTPException
from pydantic import BaseModel, Field
from controllers.emotion_detection_controller import EmotionDetectionController

router = APIRouter(
    prefix="/api/emotion-detection",
    tags=["emotion-detection"]
)

controller = EmotionDetectionController()

class EmotionRequest(BaseModel):
    text: str = Field(..., description="The text to analyze for emotions")
    threshold: float = Field(0.2, ge=0.0, le=1.0, description="Probability threshold (default 0.2)")

class EmotionResponse(BaseModel):
    emotions: list[str] = Field(..., description="List of detected emotions above threshold")
    all_probabilities: dict[str, float] = Field(..., description="Probability scores for all emotion labels, sorted descending")

@router.post("/", response_model=EmotionResponse)
async def detect_emotion(request: EmotionRequest):
    """
    Detect emotions in the given text

    - **text**: The text to analyze
    - **threshold**: Minimum probability to consider an emotion detected (default 0.3)
    """
    try:
        emotions, all_probabilities = controller.predict_emotion(request.text, threshold=request.threshold)
        return EmotionResponse(emotions=emotions, all_probabilities=all_probabilities)
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))