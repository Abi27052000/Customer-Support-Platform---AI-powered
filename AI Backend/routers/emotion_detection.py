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

class EmotionResponse(BaseModel):
    emotions: list[str] = Field(..., description="List of detected emotions")

@router.post("/", response_model=EmotionResponse)
async def detect_emotion(request: EmotionRequest):
    """
    Detect emotions in the given text

    - **text**: The text to analyze
    """
    try:
        emotions = controller.predict_emotion(request.text)
        return EmotionResponse(emotions=emotions)
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))