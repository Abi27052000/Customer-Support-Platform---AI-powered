import os
import sys
import json
import shutil
import tempfile
import subprocess
from pathlib import Path

# Add deployment folder so we can reuse the model architecture
sys.path.insert(0, os.path.join(os.path.dirname(__file__), '..', 'deployment'))

# Resolve ffmpeg — try multiple sources so it works without a system install
def _find_ffmpeg() -> str:
    import shutil as _shutil

    # 1. Already on PATH (covers conda install, winget install, etc.)
    ff = _shutil.which('ffmpeg')
    if ff:
        print(f"ffmpeg found on PATH: {ff}")
        return ff

    # 2. Bundled binary via imageio-ffmpeg (pip install imageio-ffmpeg)
    try:
        import imageio_ffmpeg
        ff = imageio_ffmpeg.get_ffmpeg_exe()
        if ff and os.path.exists(ff):
            # Also inject its directory into PATH so Whisper (which hardcodes
            # "ffmpeg" in whisper/audio.py) can find it automatically.
            ff_dir = os.path.dirname(ff)
            os.environ["PATH"] = ff_dir + os.pathsep + os.environ.get("PATH", "")
            print(f"ffmpeg found via imageio-ffmpeg: {ff}")
            return ff
    except Exception:
        pass

    raise RuntimeError(
        "FFmpeg executable not found. Run: conda install -c conda-forge ffmpeg  "
        "or: winget install ffmpeg"
    )

FFMPEG = _find_ffmpeg()
print(f"Using ffmpeg: {FFMPEG}")

import cv2
import numpy as np
import torch
import torchaudio
import whisper
from fastapi import FastAPI, File, UploadFile, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from models import MultimodalSentimentModel
from transformers import AutoTokenizer

EMOTION_MAP = {0: "anger", 1: "disgust", 2: "fear",
               3: "joy", 4: "neutral", 5: "sadness", 6: "surprise"}
SENTIMENT_MAP = {0: "negative", 1: "neutral", 2: "positive"}

BASE_DIR = os.path.dirname(__file__)
MODEL_PATH = os.path.join(BASE_DIR, '..', 'Model With Class Imbalance Fix',
                          'model_normalized', 'model.pth')
METRICS_PATH = os.path.join(BASE_DIR, '..', 'Model With Class Imbalance Fix',
                            'model_normalized', 'metrics.json')

app = FastAPI(title="EmotionSense API", version="1.0.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173", "http://localhost:3000", "http://127.0.0.1:5173"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

model_dict = None


def load_model():
    global model_dict
    print("Loading model...")
    device = torch.device("cuda" if torch.cuda.is_available() else "cpu")
    print(f"Using device: {device}")

    model = MultimodalSentimentModel().to(device)
    model_path = os.path.abspath(MODEL_PATH)
    if not os.path.exists(model_path):
        raise FileNotFoundError(f"Model file not found: {model_path}")

    model.load_state_dict(
        torch.load(model_path, map_location=device, weights_only=True)
    )
    model.eval()

    print("Loading Whisper transcriber...")
    transcriber = whisper.load_model("base", device="cpu")

    print("Loading BERT tokenizer...")
    tokenizer = AutoTokenizer.from_pretrained("bert-base-uncased")

    model_dict = {
        "model": model,
        "tokenizer": tokenizer,
        "transcriber": transcriber,
        "device": device,
    }
    print("Model ready.")


@app.on_event("startup")
async def startup():
    try:
        load_model()
    except Exception as e:
        print(f"WARNING: Model failed to load at startup: {e}")


@app.get("/health")
def health():
    return {
        "status": "ok",
        "model_loaded": model_dict is not None,
        "device": str(model_dict["device"]) if model_dict else None,
    }


@app.get("/metrics")
def get_metrics():
    metrics_path = os.path.abspath(METRICS_PATH)
    if not os.path.exists(metrics_path):
        raise HTTPException(status_code=404, detail="Metrics file not found")
    with open(metrics_path) as f:
        return json.load(f)


def _process_video_frames(video_path: str) -> torch.Tensor:
    cap = cv2.VideoCapture(video_path)
    frames = []
    try:
        while len(frames) < 30 and cap.isOpened():
            ret, frame = cap.read()
            if not ret:
                break
            frame = cv2.resize(frame, (224, 224))
            frame = frame / 255.0
            frames.append(frame)
    finally:
        cap.release()

    if len(frames) == 0:
        raise ValueError(f"No frames extracted from: {video_path}")

    # Pad to 30 frames if shorter
    if len(frames) < 30:
        frames += [np.zeros_like(frames[0])] * (30 - len(frames))
    else:
        frames = frames[:30]

    # [frames, H, W, C] -> [frames, C, H, W]
    return torch.FloatTensor(np.array(frames)).permute(0, 3, 1, 2)


def _extract_audio_features(video_path: str) -> torch.Tensor:
    audio_path = video_path + "_audio.wav"
    try:
        result = subprocess.run(
            [FFMPEG, "-y", "-i", video_path, "-vn",
             "-acodec", "pcm_s16le", "-ar", "16000", "-ac", "1", audio_path],
            capture_output=True,
            text=True,
        )
        if result.returncode != 0:
            raise ValueError(f"Audio extraction failed [{result.returncode}]: {result.stderr[-400:]}")

        waveform, sample_rate = torchaudio.load(audio_path)
        if sample_rate != 16000:
            waveform = torchaudio.transforms.Resample(sample_rate, 16000)(waveform)

        mel_spec = torchaudio.transforms.MelSpectrogram(
            sample_rate=16000, n_mels=64, n_fft=1024, hop_length=512
        )(waveform)

        std = mel_spec.std()
        mel_spec = (mel_spec - mel_spec.mean()) / (std + 1e-8)

        if mel_spec.size(2) < 300:
            mel_spec = torch.nn.functional.pad(mel_spec, (0, 300 - mel_spec.size(2)))
        else:
            mel_spec = mel_spec[:, :, :300]

        return mel_spec
    finally:
        if os.path.exists(audio_path):
            os.remove(audio_path)


def _extract_segment(video_path: str, start: float, end: float, tmp_dir: str) -> str:
    seg_name = f"seg_{start:.2f}_{end:.2f}.mp4".replace(":", "-")
    seg_path = os.path.join(tmp_dir, seg_name)
    # Use stream copy (-c copy) — no re-encoding, no codec dependencies, much faster.
    # We seek BEFORE -i (fast seek) and use -copyts to preserve timestamps.
    result = subprocess.run(
        [FFMPEG, "-y", "-ss", str(start), "-to", str(end),
         "-i", video_path, "-c", "copy", seg_path],
        capture_output=True,
        text=True,
    )
    if result.returncode != 0 or not os.path.exists(seg_path) or os.path.getsize(seg_path) == 0:
        # Fallback: re-encode if stream copy produced empty output (can happen with B-frames)
        result2 = subprocess.run(
            [FFMPEG, "-y", "-i", video_path, "-ss", str(start), "-to", str(end),
             "-c:v", "mpeg4", "-c:a", "aac", seg_path],
            capture_output=True,
            text=True,
        )
        if result2.returncode != 0:
            raise RuntimeError(
                f"Segment extraction failed [{result2.returncode}]: {result2.stderr[-400:]}"
            )
    return seg_path


def _load_audio_for_whisper(video_path: str) -> np.ndarray:
    """Decode audio to a 16 kHz float32 mono numpy array using our known FFMPEG
    binary.  Passing an ndarray to whisper.transcribe() skips its internal
    load_audio() call (which hardcodes the bare 'ffmpeg' command)."""
    result = subprocess.run(
        [
            FFMPEG, "-y", "-i", video_path,
            "-f", "f32le",          # raw 32-bit float PCM
            "-ar", "16000",         # 16 kHz sample rate (Whisper requirement)
            "-ac", "1",             # mono
            "pipe:1",               # write to stdout
        ],
        capture_output=True,
    )
    if result.returncode != 0:
        raise RuntimeError(
            f"Audio decode failed [{result.returncode}]: "
            f"{result.stderr.decode(errors='replace')[-400:]}"
        )
    return np.frombuffer(result.stdout, dtype=np.float32)


@app.post("/analyze")
async def analyze_video(file: UploadFile = File(...)):
    if model_dict is None:
        raise HTTPException(status_code=503, detail="Model is not loaded. Check /health for status.")

    suffix = Path(file.filename).suffix if file.filename else ".mp4"
    tmp_dir = tempfile.mkdtemp()
    upload_path = os.path.join(tmp_dir, f"upload{suffix}")

    try:
        # Save uploaded file
        with open(upload_path, "wb") as f:
            shutil.copyfileobj(file.file, f)

        # Decode audio via our FFMPEG path and pass as numpy array so Whisper
        # never needs to invoke 'ffmpeg' from its own subprocess call.
        audio_array = _load_audio_for_whisper(upload_path)
        transcription = model_dict["transcriber"].transcribe(
            audio_array, word_timestamps=True
        )

        model = model_dict["model"]
        tokenizer = model_dict["tokenizer"]
        device = model_dict["device"]

        predictions = []
        failed_segments = 0

        for segment in transcription["segments"]:
            seg_path = None
            try:
                seg_path = _extract_segment(
                    upload_path, segment["start"], segment["end"], tmp_dir
                )

                video_frames = _process_video_frames(seg_path)
                audio_feats = _extract_audio_features(seg_path)
                text_inputs = tokenizer(
                    segment["text"],
                    padding="max_length",
                    truncation=True,
                    max_length=128,
                    return_tensors="pt",
                )

                text_inputs = {k: v.to(device) for k, v in text_inputs.items()}
                video_frames = video_frames.unsqueeze(0).to(device)
                audio_feats = audio_feats.unsqueeze(0).to(device)

                with torch.inference_mode():
                    outputs = model(text_inputs, video_frames, audio_feats)
                    emotion_probs = torch.softmax(outputs["emotions"], dim=1)[0]
                    sentiment_probs = torch.softmax(outputs["sentiments"], dim=1)[0]

                    e_vals, e_idx = torch.topk(emotion_probs, 3)
                    s_vals, s_idx = torch.topk(sentiment_probs, 3)

                predictions.append({
                    "start_time": round(segment["start"], 2),
                    "end_time": round(segment["end"], 2),
                    "text": segment["text"].strip(),
                    "emotions": [
                        {"label": EMOTION_MAP[i.item()], "confidence": round(c.item(), 4)}
                        for i, c in zip(e_idx, e_vals)
                    ],
                    "sentiments": [
                        {"label": SENTIMENT_MAP[i.item()], "confidence": round(c.item(), 4)}
                        for i, c in zip(s_idx, s_vals)
                    ],
                })

            except Exception as e:
                failed_segments += 1
                print(f"Segment [{segment['start']:.1f}s-{segment['end']:.1f}s] failed: {e}")
            finally:
                if seg_path and os.path.exists(seg_path):
                    os.remove(seg_path)

        return {
            "utterances": predictions,
            "total_segments": len(transcription["segments"]),
            "failed_segments": failed_segments,
        }

    except HTTPException:
        raise
    except Exception as e:
        import traceback
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=str(e))
    finally:
        shutil.rmtree(tmp_dir, ignore_errors=True)


# ── Shared helper ─────────────────────────────────────────────────────────────

def _run_inference(text: str, video_frames: torch.Tensor, audio_feats: torch.Tensor,
                   model, tokenizer, device) -> dict:
    text_inputs = tokenizer(
        text,
        padding="max_length",
        truncation=True,
        max_length=128,
        return_tensors="pt",
    )
    text_inputs = {k: v.to(device) for k, v in text_inputs.items()}
    video_frames = video_frames.unsqueeze(0).to(device)
    audio_feats  = audio_feats.unsqueeze(0).to(device)

    with torch.inference_mode():
        outputs = model(text_inputs, video_frames, audio_feats)
        emotion_probs   = torch.softmax(outputs["emotions"],   dim=1)[0]
        sentiment_probs = torch.softmax(outputs["sentiments"], dim=1)[0]
        e_vals, e_idx = torch.topk(emotion_probs,   3)
        s_vals, s_idx = torch.topk(sentiment_probs, 3)

    return {
        "emotions": [
            {"label": EMOTION_MAP[i.item()], "confidence": round(c.item(), 4)}
            for i, c in zip(e_idx, e_vals)
        ],
        "sentiments": [
            {"label": SENTIMENT_MAP[i.item()], "confidence": round(c.item(), 4)}
            for i, c in zip(s_idx, s_vals)
        ],
    }


def _zero_video(device) -> torch.Tensor:
    """30 black frames of 224×224 — used when no video is available."""
    return torch.zeros(30, 3, 224, 224)


def _zero_audio(device) -> torch.Tensor:
    """Silent mel spectrogram — used when no audio is available."""
    return torch.zeros(1, 64, 300)


# ── /analyze/audio ────────────────────────────────────────────────────────────

@app.post("/analyze/audio")
async def analyze_audio(file: UploadFile = File(...)):
    """Accept an audio file (mp3/wav/m4a/ogg etc.).
    Whisper transcribes it; the model runs with zero video frames."""
    if model_dict is None:
        raise HTTPException(status_code=503, detail="Model not loaded.")

    suffix = Path(file.filename).suffix if file.filename else ".mp3"
    tmp_dir = tempfile.mkdtemp()
    upload_path = os.path.join(tmp_dir, f"upload{suffix}")

    try:
        with open(upload_path, "wb") as f:
            shutil.copyfileobj(file.file, f)

        audio_array = _load_audio_for_whisper(upload_path)
        transcription = model_dict["transcriber"].transcribe(
            audio_array, word_timestamps=True
        )

        model    = model_dict["model"]
        tokenizer = model_dict["tokenizer"]
        device   = model_dict["device"]

        predictions  = []
        failed_count = 0

        for segment in transcription["segments"]:
            try:
                # Extract mel features for this time window directly from the audio file
                seg_audio_path = os.path.join(tmp_dir, f"seg_{segment['start']:.2f}.wav")
                subprocess.run(
                    [FFMPEG, "-y", "-ss", str(segment["start"]), "-to", str(segment["end"]),
                     "-i", upload_path, "-ar", "16000", "-ac", "1", seg_audio_path],
                    capture_output=True,
                )
                if os.path.exists(seg_audio_path) and os.path.getsize(seg_audio_path) > 0:
                    audio_feats = _extract_audio_features(seg_audio_path)
                else:
                    audio_feats = _zero_audio(device)

                result = _run_inference(
                    segment["text"],
                    _zero_video(device),
                    audio_feats,
                    model, tokenizer, device,
                )
                predictions.append({
                    "start_time": round(segment["start"], 2),
                    "end_time":   round(segment["end"],   2),
                    "text":       segment["text"].strip(),
                    **result,
                })
            except Exception as e:
                failed_count += 1
                print(f"Audio segment failed: {e}")
            finally:
                if os.path.exists(seg_audio_path):
                    os.remove(seg_audio_path)

        return {
            "utterances":      predictions,
            "total_segments":  len(transcription["segments"]),
            "failed_segments": failed_count,
            "mode":            "audio",
        }

    except HTTPException:
        raise
    except Exception as e:
        import traceback; traceback.print_exc()
        raise HTTPException(status_code=500, detail=str(e))
    finally:
        shutil.rmtree(tmp_dir, ignore_errors=True)


# ── /analyze/text ─────────────────────────────────────────────────────────────

class TextRequest(dict):
    pass

from pydantic import BaseModel

class TextInput(BaseModel):
    text: str

@app.post("/analyze/text")
async def analyze_text(body: TextInput):
    """Accept plain text. Runs with zero video and zero audio tensors."""
    if model_dict is None:
        raise HTTPException(status_code=503, detail="Model not loaded.")

    text = body.text.strip()
    if not text:
        raise HTTPException(status_code=422, detail="text field is empty.")

    model    = model_dict["model"]
    tokenizer = model_dict["tokenizer"]
    device   = model_dict["device"]

    try:
        result = _run_inference(
            text,
            _zero_video(device),
            _zero_audio(device),
            model, tokenizer, device,
        )
        return {
            "utterances": [{
                "start_time": 0.0,
                "end_time":   0.0,
                "text":       text,
                **result,
            }],
            "total_segments":  1,
            "failed_segments": 0,
            "mode":            "text",
        }
    except Exception as e:
        import traceback; traceback.print_exc()
        raise HTTPException(status_code=500, detail=str(e))

