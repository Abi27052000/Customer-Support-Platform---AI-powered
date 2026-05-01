import shutil

from fastapi import APIRouter, File, HTTPException, UploadFile
from pydantic import BaseModel, Field

from controllers.emotion_sense_controller import emotion_sense_controller

router = APIRouter(
    prefix="/api/emotion-sense",
    tags=["emotion-sense"],
)


class TextInput(BaseModel):
    text: str = Field(..., description="Plain text to analyse")


# ── Health / metrics ──────────────────────────────────────────────────────────

@router.get("/health")
def health():
    return {
        "status": "ok",
        "model_loaded": emotion_sense_controller.is_loaded,
        "device": emotion_sense_controller.device,
    }


@router.get("/metrics")
def get_metrics():
    try:
        return emotion_sense_controller.get_metrics()
    except FileNotFoundError as e:
        raise HTTPException(status_code=404, detail=str(e))


# ── Video analysis ────────────────────────────────────────────────────────────

@router.post("/analyze")
async def analyze_video(file: UploadFile = File(...)):
    """Upload a video file; returns per-utterance emotion & sentiment predictions."""
    if not emotion_sense_controller.is_loaded:
        raise HTTPException(status_code=503, detail="Model not loaded — check /api/emotion-sense/health")
    try:
        file_bytes = await file.read()
        return emotion_sense_controller.analyze_video(file_bytes, file.filename or "upload.mp4")
    except HTTPException:
        raise
    except Exception as e:
        import traceback; traceback.print_exc()
        raise HTTPException(status_code=500, detail=str(e))


# ── Audio analysis ────────────────────────────────────────────────────────────

@router.post("/analyze/audio")
async def analyze_audio(file: UploadFile = File(...)):
    """Upload an audio file; returns per-utterance emotion & sentiment predictions."""
    if not emotion_sense_controller.is_loaded:
        raise HTTPException(status_code=503, detail="Model not loaded — check /api/emotion-sense/health")
    try:
        file_bytes = await file.read()
        return emotion_sense_controller.analyze_audio(file_bytes, file.filename or "upload.mp3")
    except HTTPException:
        raise
    except Exception as e:
        import traceback; traceback.print_exc()
        raise HTTPException(status_code=500, detail=str(e))


# ── Text analysis ─────────────────────────────────────────────────────────────

@router.post("/analyze/text")
async def analyze_text(body: TextInput):
    """Analyse plain text; returns emotion & sentiment using zero video/audio tensors."""
    if not emotion_sense_controller.is_loaded:
        raise HTTPException(status_code=503, detail="Model not loaded — check /api/emotion-sense/health")

    text = body.text.strip()
    if not text:
        raise HTTPException(status_code=422, detail="text field is empty.")

    try:
        return emotion_sense_controller.analyze_text(text)
    except Exception as e:
        import traceback; traceback.print_exc()
        raise HTTPException(status_code=500, detail=str(e))
