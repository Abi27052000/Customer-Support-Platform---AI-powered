import os
import sys
import json
import shutil
import tempfile
import subprocess
from pathlib import Path

# Resolve path to the emotion detection deployment folder so we can import the model architecture
_CONTROLLERS_DIR = os.path.dirname(__file__)
_AI_BACKEND_DIR  = os.path.dirname(_CONTROLLERS_DIR)
_PROJECT_DIR     = os.path.dirname(_AI_BACKEND_DIR)
_EMOTION_DEPLOY  = os.path.join(
    _PROJECT_DIR,
    "emotion detection",
    "ai-video-sentiment-model",
    "deployment",
)
_MODEL_PATH = os.path.join(
    _PROJECT_DIR,
    "emotion detection",
    "ai-video-sentiment-model",
    "Model With Class Imbalance Fix",
    "model_normalized",
    "model.pth",
)
_METRICS_PATH = os.path.join(
    _PROJECT_DIR,
    "emotion detection",
    "ai-video-sentiment-model",
    "Model With Class Imbalance Fix",
    "model_normalized",
    "metrics.json",
)

# Insert deployment folder so MultimodalSentimentModel can be imported
if _EMOTION_DEPLOY not in sys.path:
    sys.path.insert(0, _EMOTION_DEPLOY)

EMOTION_MAP   = {0: "anger", 1: "disgust", 2: "fear",
                 3: "joy",   4: "neutral", 5: "sadness", 6: "surprise"}
SENTIMENT_MAP = {0: "negative", 1: "neutral", 2: "positive"}


def _find_ffmpeg() -> str:
    import shutil as _shutil

    ff = _shutil.which("ffmpeg")
    if ff:
        return ff

    try:
        import imageio_ffmpeg
        ff = imageio_ffmpeg.get_ffmpeg_exe()
        if ff and os.path.exists(ff):
            ff_dir = os.path.dirname(ff)
            os.environ["PATH"] = ff_dir + os.pathsep + os.environ.get("PATH", "")
            return ff
    except Exception:
        pass

    raise RuntimeError(
        "FFmpeg not found. Run: conda install -c conda-forge ffmpeg  "
        "or: winget install ffmpeg"
    )


class EmotionSenseController:
    """Loads the multimodal sentiment model and exposes inference helpers."""

    def __init__(self):
        self._model_dict = None
        self._ffmpeg: str | None = None

    def load(self):
        """Load model, tokenizer and transcriber. Called once at startup."""
        import torch
        import torchaudio  # noqa: F401 — ensure available
        import whisper
        from controllers.emotion_sense_models import MultimodalSentimentModel
        from transformers import AutoTokenizer

        self._ffmpeg = _find_ffmpeg()

        device = torch.device("cuda" if torch.cuda.is_available() else "cpu")
        model = MultimodalSentimentModel().to(device)

        model_path = os.path.abspath(_MODEL_PATH)
        if not os.path.exists(model_path):
            raise FileNotFoundError(f"Model file not found: {model_path}")

        model.load_state_dict(
            torch.load(model_path, map_location=device, weights_only=True)
        )
        model.eval()

        transcriber = whisper.load_model("base", device="cpu")
        tokenizer   = AutoTokenizer.from_pretrained("bert-base-uncased")

        self._model_dict = {
            "model":       model,
            "tokenizer":   tokenizer,
            "transcriber": transcriber,
            "device":      device,
        }

    @property
    def is_loaded(self) -> bool:
        return self._model_dict is not None

    @property
    def device(self):
        return str(self._model_dict["device"]) if self._model_dict else None

    def get_metrics(self) -> dict:
        metrics_path = os.path.abspath(_METRICS_PATH)
        if not os.path.exists(metrics_path):
            raise FileNotFoundError("Metrics file not found")
        with open(metrics_path) as f:
            return json.load(f)

    # ── Internal helpers ───────────────────────────────────────────────────

    def _load_audio_for_whisper(self, video_path: str):
        import numpy as np
        result = subprocess.run(
            [self._ffmpeg, "-y", "-i", video_path,
             "-f", "f32le", "-ar", "16000", "-ac", "1", "pipe:1"],
            capture_output=True,
        )
        if result.returncode != 0:
            raise RuntimeError(
                f"Audio decode failed [{result.returncode}]: "
                f"{result.stderr.decode(errors='replace')[-400:]}"
            )
        return __import__("numpy").frombuffer(result.stdout, dtype=__import__("numpy").float32)

    def _process_video_frames(self, video_path: str):
        import cv2
        import numpy as np
        import torch
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

        if len(frames) < 30:
            frames += [np.zeros_like(frames[0])] * (30 - len(frames))
        else:
            frames = frames[:30]

        return torch.FloatTensor(np.array(frames)).permute(0, 3, 1, 2)

    def _extract_audio_features(self, video_path: str):
        import torch
        import torchaudio
        audio_path = video_path + "_audio.wav"
        try:
            result = subprocess.run(
                [self._ffmpeg, "-y", "-i", video_path, "-vn",
                 "-acodec", "pcm_s16le", "-ar", "16000", "-ac", "1", audio_path],
                capture_output=True, text=True,
            )
            if result.returncode != 0:
                raise ValueError(
                    f"Audio extraction failed [{result.returncode}]: {result.stderr[-400:]}"
                )

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

    def _extract_segment(self, video_path: str, start: float, end: float, tmp_dir: str) -> str:
        seg_name = f"seg_{start:.2f}_{end:.2f}.mp4".replace(":", "-")
        seg_path = os.path.join(tmp_dir, seg_name)
        result = subprocess.run(
            [self._ffmpeg, "-y", "-ss", str(start), "-to", str(end),
             "-i", video_path, "-c", "copy", seg_path],
            capture_output=True, text=True,
        )
        if result.returncode != 0 or not os.path.exists(seg_path) or os.path.getsize(seg_path) == 0:
            result2 = subprocess.run(
                [self._ffmpeg, "-y", "-i", video_path, "-ss", str(start), "-to", str(end),
                 "-c:v", "mpeg4", "-c:a", "aac", seg_path],
                capture_output=True, text=True,
            )
            if result2.returncode != 0:
                raise RuntimeError(
                    f"Segment extraction failed [{result2.returncode}]: {result2.stderr[-400:]}"
                )
        return seg_path

    def _zero_video(self):
        import torch
        return torch.zeros(30, 3, 224, 224)

    def _zero_audio(self):
        import torch
        return torch.zeros(1, 64, 300)

    def _run_inference(self, text: str, video_frames, audio_feats) -> dict:
        import torch
        md = self._model_dict
        model, tokenizer, device = md["model"], md["tokenizer"], md["device"]

        text_inputs = tokenizer(
            text,
            padding="max_length",
            truncation=True,
            max_length=128,
            return_tensors="pt",
        )
        text_inputs  = {k: v.to(device) for k, v in text_inputs.items()}
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

    # ── Public analysis methods ────────────────────────────────────────────

    def analyze_video(self, file_bytes: bytes, filename: str) -> dict:
        suffix  = Path(filename).suffix if filename else ".mp4"
        tmp_dir = tempfile.mkdtemp()
        upload_path = os.path.join(tmp_dir, f"upload{suffix}")
        try:
            with open(upload_path, "wb") as f:
                f.write(file_bytes)

            audio_array   = self._load_audio_for_whisper(upload_path)
            transcription = self._model_dict["transcriber"].transcribe(
                audio_array, word_timestamps=True
            )

            predictions    = []
            failed_segments = 0

            for segment in transcription["segments"]:
                seg_path = None
                try:
                    seg_path = self._extract_segment(
                        upload_path, segment["start"], segment["end"], tmp_dir
                    )
                    video_frames = self._process_video_frames(seg_path)
                    audio_feats  = self._extract_audio_features(seg_path)
                    result = self._run_inference(segment["text"], video_frames, audio_feats)
                    predictions.append({
                        "start_time": round(segment["start"], 2),
                        "end_time":   round(segment["end"],   2),
                        "text":       segment["text"].strip(),
                        **result,
                    })
                except Exception as e:
                    failed_segments += 1
                    print(f"Segment [{segment['start']:.1f}s-{segment['end']:.1f}s] failed: {e}")
                finally:
                    if seg_path and os.path.exists(seg_path):
                        os.remove(seg_path)

            return {
                "utterances":      predictions,
                "total_segments":  len(transcription["segments"]),
                "failed_segments": failed_segments,
            }
        finally:
            shutil.rmtree(tmp_dir, ignore_errors=True)

    def analyze_audio(self, file_bytes: bytes, filename: str) -> dict:
        suffix  = Path(filename).suffix if filename else ".mp3"
        tmp_dir = tempfile.mkdtemp()
        upload_path = os.path.join(tmp_dir, f"upload{suffix}")
        try:
            with open(upload_path, "wb") as f:
                f.write(file_bytes)

            audio_array   = self._load_audio_for_whisper(upload_path)
            transcription = self._model_dict["transcriber"].transcribe(
                audio_array, word_timestamps=True
            )

            predictions  = []
            failed_count = 0

            for segment in transcription["segments"]:
                seg_audio_path = os.path.join(tmp_dir, f"seg_{segment['start']:.2f}.wav")
                try:
                    subprocess.run(
                        [self._ffmpeg, "-y",
                         "-ss", str(segment["start"]), "-to", str(segment["end"]),
                         "-i", upload_path,
                         "-ar", "16000", "-ac", "1", seg_audio_path],
                        capture_output=True,
                    )
                    if os.path.exists(seg_audio_path) and os.path.getsize(seg_audio_path) > 0:
                        audio_feats = self._extract_audio_features(seg_audio_path)
                    else:
                        audio_feats = self._zero_audio()

                    result = self._run_inference(
                        segment["text"], self._zero_video(), audio_feats
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
        finally:
            shutil.rmtree(tmp_dir, ignore_errors=True)

    def analyze_text(self, text: str) -> dict:
        result = self._run_inference(text, self._zero_video(), self._zero_audio())
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


# Module-level singleton — shared across the whole FastAPI process
emotion_sense_controller = EmotionSenseController()
