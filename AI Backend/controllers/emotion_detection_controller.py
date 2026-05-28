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

    def predict_emotion(self, text: str, threshold: float = 0.2):
        # Embed the text
        embedding = self.embedder.encode([text])
        # OneVsRestClassifier.predict_proba returns shape (n_samples, n_classes)
        # Each value is the probability of that label being 1
        probas = self.model.predict_proba(embedding)[0]  # shape: (n_classes,)
        # Detected emotions above threshold
        emotions = [self.emotion_labels[i] for i, p in enumerate(probas) if p >= threshold]
        # All label probabilities sorted descending
        all_probabilities = dict(
            sorted(
                {self.emotion_labels[i]: round(float(p), 4) for i, p in enumerate(probas)}.items(),
                key=lambda x: x[1],
                reverse=True,
            )
        )
        return emotions, all_probabilities
