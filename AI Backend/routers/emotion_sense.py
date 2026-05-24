import time

from fastapi import APIRouter, File, Form, HTTPException, UploadFile
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
async def analyze_video(file: UploadFile = File(...), fast_mode: bool = Form(False)):
    """Upload a video file; returns per-utterance emotion & sentiment predictions."""
    if not emotion_sense_controller.is_loaded:
        raise HTTPException(status_code=503, detail="Model not loaded — check /api/emotion-sense/health")
    started_at = time.perf_counter()
    try:
        file_bytes = await file.read()
        filename = file.filename or "upload.mp4"
        print(
            "[EmotionSense Video] Request received: "
            f"filename={filename}, content_type={file.content_type}, "
            f"size_bytes={len(file_bytes)}, fast_mode={fast_mode}"
        )
        if fast_mode:
            result = emotion_sense_controller.analyze_video_clip(file_bytes, filename)
        else:
            result = emotion_sense_controller.analyze_video(file_bytes, filename)

        duration_ms = round((time.perf_counter() - started_at) * 1000, 2)
        top = result.get("utterances", [{}])[0].get("emotions", [{}])[0]
        print(
            "[EmotionSense Video] Request complete: "
            f"duration_ms={duration_ms}, mode={result.get('mode')}, "
            f"segments={result.get('total_segments')}, failed={result.get('failed_segments')}, "
            f"top_emotion={top.get('label')}:{top.get('confidence')}"
        )
        return result
    except HTTPException:
        raise
    except Exception as e:
        import traceback; traceback.print_exc()
        duration_ms = round((time.perf_counter() - started_at) * 1000, 2)
        print(f"[EmotionSense Video] Request failed after {duration_ms} ms: {e}")
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
