FROM docker.io/library/python:3.11-slim

ENV PYTHONDONTWRITEBYTECODE=1 \
    PYTHONUNBUFFERED=1 \
    PIP_NO_CACHE_DIR=1 \
    HF_HOME=/cache \
    HF_HUB_DISABLE_TELEMETRY=1

WORKDIR /app

COPY requirements.txt ./

RUN python -m pip install --upgrade pip \
    && python -m pip install --extra-index-url https://download.pytorch.org/whl/cpu torch \
    && python -m pip install -r requirements.txt

COPY app.py ./

EXPOSE 8000

CMD ["uvicorn", "app:app", "--host", "0.0.0.0", "--port", "8000"]
