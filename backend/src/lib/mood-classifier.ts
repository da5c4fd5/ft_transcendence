import { db } from "../db";

const MOOD_CLASSIFIER_URL =
  process.env.MOOD_CLASSIFIER_URL ?? "http://mood-classifier:8000";
const MOOD_CLASSIFIER_MODEL =
  process.env.MOOD_CLASSIFIER_MODEL_ID ??
  "AnasAlokla/multilingual_go_emotions_V1.2";
const MOOD_CLASSIFIER_TIMEOUT_MS = 120_000;
const MOOD_CLASSIFIER_MAX_RETRIES = 4;
const MOOD_CLASSIFIER_BASE_RETRY_DELAY_MS = 15_000;

type RawMoodPrediction = {
  label: string;
  score: number;
};

type MoodClassifierResponse = {
  model?: string;
  truncated?: boolean;
  labels?: unknown;
};

type AppMood =
  | "Joyful"
  | "Excited"
  | "Peaceful"
  | "Nostalgic"
  | "Sad"
  | "Anxious";

const JOYFUL_LABELS = [
  "admiration",
  "amusement",
  "approval",
  "caring",
  "gratitude",
  "joy",
  "love",
  "pride"
] as const;

const EXCITED_LABELS = [
  "desire",
  "excitement",
  "optimism",
  "surprise"
] as const;

const PEACEFUL_LABELS = ["neutral", "relief", "curiosity"] as const;
const SAD_LABELS = ["disappointment", "grief", "sadness"] as const;
const ANXIOUS_LABELS = [
  "anger",
  "annoyance",
  "confusion",
  "disapproval",
  "disgust",
  "embarrassment",
  "fear",
  "nervousness"
] as const;

let moodWorkerPromise: Promise<void> | null = null;
let moodWorkerWakeTimer: ReturnType<typeof setTimeout> | null = null;

function normalizeWhitespace(value: string) {
  return value.replace(/\s+/g, " ").trim();
}

function isPrediction(value: unknown): value is RawMoodPrediction {
  return (
    !!value &&
    typeof value === "object" &&
    typeof (value as { label?: unknown }).label === "string" &&
    typeof (value as { score?: unknown }).score === "number"
  );
}

function maxScore(scoreMap: Map<string, number>, labels: readonly string[]) {
  return labels.reduce(
    (highest, label) => Math.max(highest, scoreMap.get(label) ?? 0),
    0
  );
}

function deriveMood(predictions: RawMoodPrediction[]) {
  const scoreMap = new Map(
    predictions.map((prediction) => [prediction.label, prediction.score])
  );

  const joyful = maxScore(scoreMap, JOYFUL_LABELS);
  const excited = maxScore(scoreMap, EXCITED_LABELS);
  const peaceful = maxScore(scoreMap, PEACEFUL_LABELS);
  const sad = Math.max(maxScore(scoreMap, SAD_LABELS), scoreMap.get("remorse") ?? 0);
  const anxious = maxScore(scoreMap, ANXIOUS_LABELS);
  const nostalgic = Math.max(
    scoreMap.get("realization") ?? 0,
    Math.min(Math.max(joyful, scoreMap.get("relief") ?? 0), sad)
  );

  const ranked = [
    { mood: "Joyful", score: joyful },
    { mood: "Excited", score: excited },
    { mood: "Peaceful", score: peaceful },
    { mood: "Nostalgic", score: nostalgic },
    { mood: "Sad", score: sad },
    { mood: "Anxious", score: anxious }
  ] satisfies { mood: AppMood; score: number }[];

  ranked.sort((left, right) => right.score - left.score);
  return ranked[0]?.mood ?? "Peaceful";
}

function clearMoodWorkerWakeTimer() {
  if (moodWorkerWakeTimer) {
    clearTimeout(moodWorkerWakeTimer);
    moodWorkerWakeTimer = null;
  }
}

function scheduleMoodWorkerWake(delayMs: number) {
  clearMoodWorkerWakeTimer();
  moodWorkerWakeTimer = setTimeout(() => {
    moodWorkerWakeTimer = null;
    void ensureMoodClassificationWorker();
  }, delayMs);
}

async function classifyMemoryContent(content: string) {
  const response = await fetch(`${MOOD_CLASSIFIER_URL}/classify`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    signal: AbortSignal.timeout(MOOD_CLASSIFIER_TIMEOUT_MS),
    body: JSON.stringify({ text: content })
  });

  if (!response.ok) {
    throw new Error(`Mood classifier returned ${response.status}`);
  }

  const payload = (await response.json()) as MoodClassifierResponse;
  const labels = Array.isArray(payload.labels)
    ? payload.labels.filter(isPrediction)
    : [];

  if (labels.length === 0) {
    throw new Error("Mood classifier returned no labels");
  }

  labels.sort((left, right) => right.score - left.score);

  return {
    model: payload.model ?? MOOD_CLASSIFIER_MODEL,
    labels,
    mood: deriveMood(labels),
    rawLabel: labels[0].label,
    rawScore: labels[0].score
  };
}

async function claimNextMoodClassificationJob() {
  const now = new Date();

  return db.$transaction(async (tx) => {
    const job = await tx.moodClassificationJob.findFirst({
      where: {
        status: "QUEUED",
        availableAt: { lte: now }
      },
      orderBy: [{ availableAt: "asc" }, { createdAt: "asc" }]
    });

    if (!job) return null;

    return tx.moodClassificationJob.update({
      where: { id: job.id },
      data: {
        status: "PROCESSING",
        attempts: { increment: 1 },
        startedAt: now,
        finishedAt: null,
        lastError: null
      }
    });
  });
}

async function scheduleNextPendingMoodJobWake() {
  const nextPending = await db.moodClassificationJob.findFirst({
    where: { status: "QUEUED" },
    orderBy: { availableAt: "asc" },
    select: { availableAt: true }
  });

  if (!nextPending) return;

  scheduleMoodWorkerWake(
    Math.max(0, nextPending.availableAt.getTime() - Date.now())
  );
}

function formatMoodClassificationError(error: unknown) {
  if (error instanceof Error && error.message.trim()) return error.message;
  return "Unknown mood classification error";
}

async function markMoodClassificationFailure(
  jobId: string,
  attempts: number,
  error: unknown
) {
  const lastError = formatMoodClassificationError(error);
  const shouldRetry = attempts < MOOD_CLASSIFIER_MAX_RETRIES;

  await db.moodClassificationJob.update({
    where: { id: jobId },
    data: {
      status: shouldRetry ? "QUEUED" : "FAILED",
      availableAt: shouldRetry
        ? new Date(
            Date.now() +
              MOOD_CLASSIFIER_BASE_RETRY_DELAY_MS * Math.max(1, attempts)
          )
        : undefined,
      lastError,
      finishedAt: new Date()
    }
  });

  if (!shouldRetry) {
    console.error("Mood classification failed permanently", {
      jobId,
      attempts,
      lastError
    });
  }
}

async function processMoodClassificationJob(jobId: string) {
  const job = await db.moodClassificationJob.findUnique({
    where: { id: jobId }
  });

  if (!job || job.status !== "PROCESSING") return;

  try {
    const result = await classifyMemoryContent(job.content);

    await db.$transaction(async (tx) => {
      const currentJob = await tx.moodClassificationJob.findUnique({
        where: { id: jobId },
        select: { status: true }
      });

      if (!currentJob || currentJob.status !== "PROCESSING") return;

      await tx.memory.update({
        where: { id: job.memoryId },
        data: {
          mood: result.mood,
          moodSource: "CLASSIFIED"
        }
      });

      await tx.moodClassificationJob.update({
        where: { id: jobId },
        data: {
          status: "COMPLETED",
          classifierModel: result.model,
          rawLabel: result.rawLabel,
          rawScore: result.rawScore,
          mood: result.mood,
          labelsJson: result.labels,
          lastError: null,
          finishedAt: new Date()
        }
      });
    });
  } catch (error) {
    await markMoodClassificationFailure(jobId, job.attempts, error);
    console.error("Failed to classify memory mood", {
      jobId,
      memoryId: job.memoryId,
      error
    });
  }
}

async function runMoodClassificationWorker() {
  while (true) {
    const nextJob = await claimNextMoodClassificationJob();
    if (!nextJob) break;
    await processMoodClassificationJob(nextJob.id);
  }

  await scheduleNextPendingMoodJobWake();
}

export function ensureMoodClassificationWorker() {
  clearMoodWorkerWakeTimer();

  if (moodWorkerPromise) return moodWorkerPromise;

  moodWorkerPromise = runMoodClassificationWorker().finally(() => {
    moodWorkerPromise = null;
  });

  return moodWorkerPromise;
}

export async function enqueueMoodClassification(
  userId: string,
  memoryId: string,
  content: string
) {
  const normalizedContent = normalizeWhitespace(content);

  if (!normalizedContent) return;

  await db.moodClassificationJob.upsert({
    where: { memoryId },
    create: {
      memoryId,
      userId,
      content: normalizedContent,
      status: "QUEUED",
      availableAt: new Date(),
      classifierModel: MOOD_CLASSIFIER_MODEL
    },
    update: {
      userId,
      content: normalizedContent,
      status: "QUEUED",
      attempts: 0,
      availableAt: new Date(),
      startedAt: null,
      finishedAt: null,
      classifierModel: MOOD_CLASSIFIER_MODEL,
      rawLabel: null,
      rawScore: null,
      mood: null,
      labelsJson: null,
      lastError: null
    }
  });

  void ensureMoodClassificationWorker();
}

export async function clearMoodClassification(memoryId: string) {
  await db.moodClassificationJob.deleteMany({ where: { memoryId } });
}

export async function bootstrapMoodClassificationWorker() {
  await db.moodClassificationJob.updateMany({
    where: { status: "PROCESSING" },
    data: {
      status: "QUEUED",
      availableAt: new Date(),
      startedAt: null,
      finishedAt: null
    }
  });

  const pendingJobs = await db.moodClassificationJob.count({
    where: { status: "QUEUED" }
  });

  if (pendingJobs > 0) {
    void ensureMoodClassificationWorker();
  }
}
