# train_emotion_modal.py
from pathlib import Path
import modal
import pandas as pd
import numpy as np
import joblib
from sklearn.model_selection import train_test_split
from sklearn.linear_model import LogisticRegression
from sklearn.multiclass import OneVsRestClassifier
from sklearn.metrics import classification_report

#  Create Modal app and image
app = modal.App("go-emotions-training")

image = (
    modal.Image.debian_slim()
    .pip_install(
        "sentence-transformers",
        "datasets",
        "scikit-learn",
        "pandas",
        "numpy",
        "joblib",
        "torch",
        "tqdm"
    )
)

#  Create Modal volume for saving model
model_volume = modal.Volume.from_name("emotion-model", create_if_missing=True)

#  Remote training function
@app.function(
    image=image,
    gpu="A10G",  # GPU instance
    volumes={"/models": model_volume},  # persist trained model
    timeout=60 * 60 * 3,  # max 3 hours
)
def train():
    from sentence_transformers import SentenceTransformer
    from datasets import load_dataset
    from tqdm import tqdm

    print("Loading dataset...")
    dataset = load_dataset("go_emotions", "raw")
    df = pd.DataFrame(dataset["train"])

    # Define emotion columns
    emotion_columns = [
        'admiration','amusement','anger','annoyance','approval','caring',
        'confusion','curiosity','desire','disappointment','disapproval',
        'disgust','embarrassment','excitement','fear','gratitude','grief',
        'joy','love','nervousness','optimism','pride','realization',
        'relief','remorse','sadness','surprise','neutral'
    ]

    # Remove rows with no labels
    df = df[df[emotion_columns].sum(axis=1) > 0]

    # Optional: reduce dataset for faster training
    df = df.sample(40000, random_state=42)

    texts = df["text"].tolist()
    y = df[emotion_columns].values

    print("Loading embedding model...")
    model = SentenceTransformer("all-MiniLM-L6-v2", device="cuda")

    print("Generating embeddings...")
    # Use tqdm for progress monitoring
    batch_size = 64
    embeddings = []
    for i in tqdm(range(0, len(texts), batch_size)):
        batch_texts = texts[i:i+batch_size]
        batch_embeddings = model.encode(batch_texts, show_progress_bar=False)
        embeddings.append(batch_embeddings)
    X = np.vstack(embeddings)

    print("Splitting dataset...")
    X_train, X_test, y_train, y_test = train_test_split(
        X, y, test_size=0.2, random_state=42
    )

    print("Training multi-label classifier...")
    clf = OneVsRestClassifier(LogisticRegression(max_iter=1000))
    clf.fit(X_train, y_train)

    print("Evaluating model...")
    y_pred = clf.predict(X_test)
    report = classification_report(y_test, y_pred, target_names=emotion_columns)
    print(report)

    print("Saving trained model to /models/emotion_classifier.pkl")
    joblib.dump(clf, "/models/emotion_classifier.pkl")

    print("Training complete!")

#  Entrypoint — run remotely
@app.local_entrypoint()
def main():
    # Start training remotely on Modal GPU
    job = train.remote()
    print("Training started remotely. Job ID:", job.id)
    print("You can close your terminal. To monitor logs, run:")
    print(f"modal logs {job.id}")
