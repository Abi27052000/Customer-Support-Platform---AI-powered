from pathlib import Path
import joblib
from sentence_transformers import SentenceTransformer
import numpy as np

class EmotionDetectionController:
    def __init__(self):
        # Path to the model
        model_path = Path(__file__).parent.parent / ".." / "text emotion detection" / "models" / "text_emotion_detection_model1.joblib"
        self.model = joblib.load(model_path)
        # Load the embedding model
        self.embedder = SentenceTransformer("all-MiniLM-L6-v2")

        # Emotion labels from the training
        self.emotion_labels = [
            'admiration','amusement','anger','annoyance','approval','caring',
            'confusion','curiosity','desire','disappointment','disapproval',
            'disgust','embarrassment','excitement','fear','gratitude','grief',
            'joy','love','nervousness','optimism','pride','realization',
            'relief','remorse','sadness','surprise','neutral'
        ]

    def predict_emotion(self, text: str):
        # Embed the text
        embedding = self.embedder.encode([text])
        # Predict
        predictions = self.model.predict(embedding)
        # Get the emotions where prediction is 1
        emotions = [self.emotion_labels[i] for i in range(len(self.emotion_labels)) if predictions[0][i] == 1]
        return emotions
