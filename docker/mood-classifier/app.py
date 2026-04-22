import os
from typing import Any

import torch
from fastapi import FastAPI, HTTPException
from pydantic import BaseModel, Field
from transformers import AutoModelForSequenceClassification, AutoTokenizer


MODEL_ID = os.getenv(
    "MOOD_CLASSIFIER_MODEL_ID",
    "AnasAlokla/multilingual_go_emotions_V1.2",
)
MAX_LENGTH = int(os.getenv("MOOD_CLASSIFIER_MAX_LENGTH", "512"))
TOP_K = int(os.getenv("MOOD_CLASSIFIER_TOP_K", "28"))

app = FastAPI(title="Capsul Mood Classifier")

tokenizer: AutoTokenizer | None = None
model: AutoModelForSequenceClassification | None = None


class ClassifyRequest(BaseModel):
    text: str = Field(min_length=1, max_length=4000)


class LabelPrediction(BaseModel):
    label: str
    score: float


class ClassifyResponse(BaseModel):
    model: str
    truncated: bool
    labels: list[LabelPrediction]


@app.on_event("startup")
def load_model() -> None:
    global tokenizer, model
    tokenizer = AutoTokenizer.from_pretrained(MODEL_ID)
    model = AutoModelForSequenceClassification.from_pretrained(MODEL_ID)
    model.eval()


def require_model() -> tuple[AutoTokenizer, AutoModelForSequenceClassification]:
    if tokenizer is None or model is None:
        raise HTTPException(status_code=503, detail="Model not loaded yet")
    return tokenizer, model


@app.get("/health")
def health() -> dict[str, Any]:
    ready = tokenizer is not None and model is not None
    return {
        "status": "ok" if ready else "loading",
        "ready": ready,
        "model": MODEL_ID,
    }


@app.post("/classify", response_model=ClassifyResponse)
def classify(payload: ClassifyRequest) -> ClassifyResponse:
    loaded_tokenizer, loaded_model = require_model()
    encoded = loaded_tokenizer(
        payload.text,
        return_tensors="pt",
        truncation=True,
        max_length=MAX_LENGTH,
    )
    truncated = bool(encoded["input_ids"].shape[-1] >= MAX_LENGTH)

    with torch.inference_mode():
        logits = loaded_model(**encoded).logits[0]
        scores = torch.sigmoid(logits).tolist()

    labels = [
        LabelPrediction(
            label=str(loaded_model.config.id2label[index]),
            score=float(score),
        )
        for index, score in enumerate(scores)
    ]
    labels.sort(key=lambda item: item.score, reverse=True)

    return ClassifyResponse(
        model=MODEL_ID,
        truncated=truncated,
        labels=labels[:TOP_K],
    )
