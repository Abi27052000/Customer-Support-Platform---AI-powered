# EmotionSense — Local Development Setup

## Prerequisites
- Python 3.10+
- Node.js 18+
- **FFmpeg** installed and on your PATH
  - Windows: `winget install ffmpeg` or download from https://ffmpeg.org/download.html
  - Mac: `brew install ffmpeg`
  - Linux: `sudo apt install ffmpeg`

---

## 1. Start the FastAPI Backend

```bash
cd backend
pip install -r requirements.txt
uvicorn main:app --reload --port 8000
```

The first startup downloads:
- BERT (`bert-base-uncased`) — ~440 MB
- Whisper `base` model — ~140 MB
- R3D-18 video backbone weights

Check it's ready: http://localhost:8000/health  
API docs: http://localhost:8000/docs

---

## 2. Start the React Frontend

```bash
cd ui
npm install
npm run dev
```

Open http://localhost:5173

---

## API Endpoints

| Method | Path       | Description                        |
|--------|------------|------------------------------------|
| GET    | /health    | Model load status                  |
| GET    | /metrics   | Training loss / epoch metrics      |
| POST   | /analyze   | Upload video → utterance emotions  |

### POST /analyze — Response shape
```json
{
  "utterances": [
    {
      "start_time": 0.0,
      "end_time": 3.5,
      "text": "Hello, how are you?",
      "emotions": [
        { "label": "joy",     "confidence": 0.42 },
        { "label": "neutral", "confidence": 0.31 },
        { "label": "surprise","confidence": 0.15 }
      ],
      "sentiments": [
        { "label": "positive","confidence": 0.61 },
        { "label": "neutral", "confidence": 0.29 },
        { "label": "negative","confidence": 0.10 }
      ]
    }
  ],
  "total_segments": 5,
  "failed_segments": 0
}
```

## Model
Trained on [MELD dataset](https://github.com/declare-lab/MELD) — 7 emotions × 3 sentiments.  
Weights: `Model With Class Imbalance Fix/model_normalized/model.pth`
