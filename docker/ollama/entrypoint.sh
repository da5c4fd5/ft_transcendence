#!/bin/sh
set -eu

MODEL="${OLLAMA_MODEL:-alibayram/smollm3}"
KEEP_ALIVE="${OLLAMA_KEEP_ALIVE:--1}"

if [ -z "${CUDA_VISIBLE_DEVICES:-}" ]; then
  unset CUDA_VISIBLE_DEVICES
fi

ollama serve &
OLLAMA_PID=$!

until ollama list >/dev/null 2>&1; do
  sleep 1
done

(
  if ! ollama show "$MODEL" >/dev/null 2>&1; then
    ollama pull "$MODEL"
  fi

  OLLAMA_KEEP_ALIVE="$KEEP_ALIVE" ollama run "$MODEL" "" >/dev/null 2>&1 || true
) &

wait "$OLLAMA_PID"
