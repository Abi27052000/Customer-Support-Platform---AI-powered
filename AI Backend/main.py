from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from routers import AI_Chat, healthcheck, rag, vapi_webhook, emotion_detection, emotion_sense
from controllers.emotion_sense_controller import emotion_sense_controller

app = FastAPI(
    title="AI Backend API",
    description="Customer Support Platform - AI Backend",
    version="1.0.0"
)

# Configure CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173", "http://localhost:3000"],  # React dev servers
    allow_credentials=True,
    allow_methods=["*"],  # Allow all methods
    allow_headers=["*"],  # Allow all headers
)

@app.on_event("startup")
async def _load_emotion_sense_model():
    try:
        emotion_sense_controller.load()
        print("EmotionSense model loaded successfully.")
    except Exception as e:
        print(f"WARNING: EmotionSense model failed to load: {e}")

# Include routers
app.include_router(healthcheck.router)
app.include_router(rag.router)
app.include_router(AI_Chat.router)
app.include_router(vapi_webhook.router)
app.include_router(emotion_detection.router)
app.include_router(emotion_sense.router)

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
