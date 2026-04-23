import { createHash } from "crypto";
import { status } from "elysia";
import { db } from "../db";

const OLLAMA_BASE_URL = process.env.OLLAMA_BASE_URL ?? "http://ollama:11434";
const OLLAMA_MODEL = process.env.OLLAMA_MODEL ?? "qwen3:4b-instruct-2507-q4_K_M";
const PROMPT_QUEUE_TARGET = 18;
const PROMPT_HISTORY_LIMIT = 24;
const PROMPT_PREEMPTIVE_THRESHOLD = 10;
const PROMPT_CACHE_TTL_MS = 24 * 60 * 60 * 1000;
const PROMPT_GENERATION_TIMEOUT_MS = 90_000;
const PROMPT_MIN_CHARS = 12;
const PROMPT_UI_MAX_CHARS = 68;

function buildSystemPrompt(targetCount: number) {
  return `You generate writing prompts for a private memory journal.

Return JSON only with this exact shape:
{"prompts":["prompt 1","prompt 2"]}

Your task is to generate topic ideas the user can write about.
You are not writing memories.
You are not continuing the user's story.
You are not inventing scenes, people, relationships, or past events.
You are not writing poetic lines or sample diary entries.

Grounding rules:
- Use only themes that are explicit in the user's history.
- You may use closely related themes only when they naturally follow from the history.
- When the history is short, narrow, or simple, stay close to the strongest themes.
- Relevance is more important than variety.
- Do not introduce topics that are darker, heavier, or more dramatic than the history itself.

Perspective rules:
- Every prompt must address only the user.
- Never write as if the speaker is part of the relationship, memory, or experience.
- Never use shared-perspective wording such as "our", "us", "we", or similar.
- Never imply the assistant has a relationship, memory, or shared experience with the user.
- Prefer phrasing such as "your partner", "someone", "the other person", or "that moment".

Forbidden unless clearly supported by the history:
- death
- grief
- breakup
- betrayal
- trauma
- abuse
- danger
- illness
- childhood
- family history
- parenthood
- major life regret

Hard rules:
- Generate exactly ${targetCount} prompts.
- Each prompt must be a single sentence in English.
- English only. Do not output any other language.
- Each prompt must be between ${PROMPT_MIN_CHARS} and ${PROMPT_UI_MAX_CHARS} characters.
- Each prompt must be clear, natural, and useful.
- Each prompt must be a real writing prompt, not a memory, quote, or statement.
- Each prompt must be either:
  1) a direct question, or
  2) a direct instruction starting with "Describe", "Write about", "Reflect on", or "Recall".
- Do not write first-person statements.
- Do not use "I", "my", "me", "we", "our", or "us".
- Do not assert that something happened.
- Do not mention the user's history.
- Do not repeat the user's wording verbatim.
- Do not output headings, explanations, examples, markdown, or numbering.
- Avoid duplicates and near-duplicates.

Before finalizing, reject any prompt that:
- introduces a theme not supported by the history
- sounds like a fake memory
- uses "I", "my", "me", "we", "our", or "us"
- implies the assistant is part of the experience
- repeats another prompt too closely`;
}

type MemoryHistoryItem = {
  date: Date;
  content: string;
  mood: string | null;
};

type GenerationMode = "replace" | "topup";

type GenerationController = {
  promise: Promise<void>;
  queuedMode: GenerationMode | null;
};

type GeneratedPromptBatch = {
  contextHash: string;
  requestPrompt: string;
  targetCount: number;
  prompts: string[];
};

const generationControllers = new Map<string, GenerationController>();

function normalizeWhitespace(value: string) {
  return value.replace(/\s+/g, " ").trim();
}

function sanitizePrompt(value: string) {
  return normalizeWhitespace(
    value
      .replace(/^[-*0-9.)\s"'`]+/, "")
      .replace(/^prompt:\s*/i, "")
  );
}

function uniquePrompts(prompts: string[]) {
  const seen = new Set<string>();
  return prompts.filter((prompt) => {
    const key = prompt.toLowerCase();
    if (!prompt || seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}

function memoryLabel(memory: MemoryHistoryItem) {
  return memory.date.toISOString().split("T")[0];
}

function buildContextHash(memories: MemoryHistoryItem[]) {
  return createHash("sha256")
    .update(
      JSON.stringify(
        memories.map((memory) => ({
          date: memoryLabel(memory),
          mood: memory.mood,
          content: normalizeWhitespace(memory.content)
        }))
      )
    )
    .digest("hex");
}

async function ensurePromptState(userId: string) {
  return db.promptSuggestionState.upsert({
    where: { userId },
    create: {
      userId,
      generationToken: crypto.randomUUID(),
      generationStatus: "IDLE",
      model: OLLAMA_MODEL,
      systemPrompt: buildSystemPrompt(PROMPT_QUEUE_TARGET)
    },
    update: {}
  });
}

async function loadMemoryHistory(userId: string) {
  return db.memory.findMany({
    where: { userId },
    orderBy: { date: "desc" },
    take: PROMPT_HISTORY_LIMIT,
    select: {
      date: true,
      content: true,
      mood: true
    }
  });
}

function buildPromptRequest(memories: MemoryHistoryItem[]) {
  if (memories.length === 0) {
    return [
      "Recent memory history: none yet.",
      "",
      "Generate prompts that help someone start a reflective daily memory journal.",
      "Give topic ideas to explore, not sample memories.",
      "Keep the wording addressed only to the user.",
      'Never use "I", "my", "me", "we", "our", or "us".'
    ].join("\n");
  }

  const history = memories.map((memory, index) => {
    const content = normalizeWhitespace(memory.content).slice(0, 240);
    const mood = memory.mood ? ` | mood=${memory.mood}` : "";
    return `${index + 1}. date=${memoryLabel(memory)}${mood} | memory=${content}`;
  });

  return [
    "Recent memory history:",
    ...history,
    "",
    "Silently identify the main explicit themes in the history.",
    "Generate prompts using only those themes and closely related angles.",
    "Stay close to the strongest themes when the history is short.",
    "Do not paraphrase, continue, dramatize, or fictionalize the history.",
    "Keep the wording addressed only to the user.",
    'Never use "I", "my", "me", "we", "our", or "us".',
    "Generate fresh journaling topic ideas that are relevant but not repetitive."
  ].join("\n");
}

function parseGeneratedPrompts(raw: unknown) {
  if (typeof raw !== "string" || !raw.trim()) return [];

  const trimmed = raw.trim();
  try {
    const parsed = JSON.parse(trimmed) as { prompts?: unknown } | unknown[];
    if (Array.isArray(parsed)) {
      return parsed.filter((item): item is string => typeof item === "string");
    }
    if (
      parsed &&
      typeof parsed === "object" &&
      Array.isArray((parsed as { prompts?: unknown }).prompts)
    ) {
      return (parsed as { prompts: unknown[] }).prompts.filter(
        (item): item is string => typeof item === "string"
      );
    }
  } catch {
    // Fall through to line-based parsing.
  }

  return trimmed
    .split("\n")
    .map((line) => line.trim())
    .filter(Boolean);
}

function formatError(error: unknown) {
  if (error instanceof Error && error.message.trim()) return error.message;
  return "Unknown prompt generation error";
}

async function buildGenerationInput(userId: string) {
  const memories = await loadMemoryHistory(userId);
  return {
    contextHash: buildContextHash(memories),
    requestPrompt: buildPromptRequest(memories)
  };
}

async function generatePromptBatch(input: {
  contextHash: string;
  requestPrompt: string;
  targetCount: number;
}): Promise<GeneratedPromptBatch> {
  const { contextHash, requestPrompt, targetCount } = input;
  const systemPrompt = buildSystemPrompt(targetCount);
  const response = await fetch(`${OLLAMA_BASE_URL}/api/generate`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    signal: AbortSignal.timeout(PROMPT_GENERATION_TIMEOUT_MS),
    body: JSON.stringify({
      model: OLLAMA_MODEL,
      prompt: requestPrompt,
      system: systemPrompt,
      stream: false,
      format: "json",
      keep_alive: -1
    })
  });

  if (!response.ok) {
    const responseText = normalizeWhitespace(await response.text());
    const detail = responseText ? `: ${responseText.slice(0, 240)}` : "";
    throw new Error(`Ollama returned ${response.status}${detail}`);
  }

  const payload = await response.json() as { response?: unknown };
  const prompts = uniquePrompts(
    parseGeneratedPrompts(payload.response)
      .map(sanitizePrompt)
      .filter(
        (prompt) =>
          prompt.length >= PROMPT_MIN_CHARS &&
          prompt.length <= PROMPT_UI_MAX_CHARS
      )
  ).slice(0, targetCount);

  if (prompts.length === 0) {
    throw new Error("Ollama returned no usable prompts");
  }

  return { contextHash, requestPrompt, targetCount, prompts };
}

async function markGenerationError(userId: string, expectedToken: string, error: unknown) {
  const [state, queueLength] = await Promise.all([
    db.promptSuggestionState.findUnique({
      where: { userId },
      select: { generationToken: true }
    }),
    db.promptSuggestion.count({ where: { userId } })
  ]);

  if ((state?.generationToken ?? null) !== expectedToken) return;

  await db.promptSuggestionState.update({
    where: { userId },
    data: {
      generationStatus: queueLength > 0 ? "READY" : "ERROR",
      lastError: formatError(error),
      generationFinishedAt: new Date(),
      expiresAt: queueLength > 0 ? undefined : null
    }
  });
}

async function persistGeneratedPrompts(
  userId: string,
  mode: GenerationMode,
  expectedToken: string,
  batch: GeneratedPromptBatch
) {
  await db.$transaction(async (tx) => {
    const currentState = await tx.promptSuggestionState.findUnique({
      where: { userId },
      select: { generationToken: true }
    });

    if ((currentState?.generationToken ?? null) !== expectedToken) {
      return;
    }

    const expiresAt = new Date(Date.now() + PROMPT_CACHE_TTL_MS);
    let promptsToInsert = batch.prompts;
    let startPosition = 1;

    if (mode === "replace") {
      await tx.promptSuggestion.deleteMany({ where: { userId } });
    } else {
      const existing = await tx.promptSuggestion.findMany({
        where: { userId },
        orderBy: { position: "asc" },
        select: { prompt: true, position: true }
      });

      const remainingCapacity = Math.max(0, PROMPT_QUEUE_TARGET - existing.length);
      if (remainingCapacity === 0) {
        await tx.promptSuggestionState.update({
          where: { userId },
          data: {
            contextHash: batch.contextHash,
            model: OLLAMA_MODEL,
            systemPrompt: buildSystemPrompt(batch.targetCount),
            requestPrompt: batch.requestPrompt,
            generationStatus: "READY",
            lastError: null,
            expiresAt,
            generationFinishedAt: new Date()
          }
        });
        return;
      }

      const existingPrompts = existing.map((item) => item.prompt);
      promptsToInsert = uniquePrompts([...existingPrompts, ...batch.prompts])
        .filter((prompt) => !existingPrompts.some((existingPrompt) => existingPrompt.toLowerCase() === prompt.toLowerCase()))
        .slice(0, remainingCapacity);
      startPosition = (existing.at(-1)?.position ?? 0) + 1;
    }

    if (promptsToInsert.length > 0) {
      await tx.promptSuggestion.createMany({
        data: promptsToInsert.map((prompt, index) => ({
          userId,
          prompt,
          position: startPosition + index
        }))
      });
    }

    await tx.promptSuggestionState.update({
      where: { userId },
      data: {
        contextHash: batch.contextHash,
        model: OLLAMA_MODEL,
        systemPrompt: buildSystemPrompt(batch.targetCount),
        requestPrompt: batch.requestPrompt,
        generationStatus: "READY",
        lastError: null,
        expiresAt,
        generationFinishedAt: new Date()
      }
    });
  });
}

async function runPromptSuggestionGeneration(
  userId: string,
  mode: GenerationMode,
  expectedToken: string
) {
  const input = await buildGenerationInput(userId);
  const existingCount =
    mode === "replace"
      ? 0
      : await db.promptSuggestion.count({ where: { userId } });
  const targetCount = Math.max(
    1,
    mode === "replace"
      ? PROMPT_QUEUE_TARGET
      : PROMPT_QUEUE_TARGET - existingCount
  );
  const systemPrompt = buildSystemPrompt(targetCount);
  await db.promptSuggestionState.update({
    where: { userId },
    data: {
      contextHash: input.contextHash,
      model: OLLAMA_MODEL,
      systemPrompt,
      requestPrompt: input.requestPrompt,
      generationStatus: "GENERATING",
      lastError: null,
      generationStartedAt: new Date(),
      generationFinishedAt: null
    }
  });

  try {
    const batch = await generatePromptBatch({ ...input, targetCount });
    await persistGeneratedPrompts(userId, mode, expectedToken, batch);
  } catch (error) {
    await markGenerationError(userId, expectedToken, error);
    console.error("Failed to generate prompt suggestions", error);
  }
}

async function schedulePromptSuggestionGeneration(userId: string, mode: GenerationMode) {
  const state = await ensurePromptState(userId);
  const existing = generationControllers.get(userId);

  if (existing) {
    existing.queuedMode =
      existing.queuedMode === "replace" || mode === "replace" ? "replace" : "topup";
    return existing.promise;
  }

  const controller = {
    queuedMode: null,
    promise: Promise.resolve()
  } satisfies GenerationController;

  controller.promise = (async () => {
    let currentMode: GenerationMode | null = mode;
    let expectedToken = state.generationToken ?? crypto.randomUUID();

    while (currentMode) {
      await runPromptSuggestionGeneration(userId, currentMode, expectedToken);

      if (!controller.queuedMode) break;
      currentMode = controller.queuedMode;
      controller.queuedMode = null;
      expectedToken = (await ensurePromptState(userId)).generationToken ?? crypto.randomUUID();
    }
  })().finally(() => {
    generationControllers.delete(userId);
  });

  generationControllers.set(userId, controller);
  return controller.promise;
}

async function preparePromptSuggestionRefresh(userId: string) {
  const generationToken = crypto.randomUUID();

  await db.$transaction([
    db.promptSuggestion.deleteMany({ where: { userId } }),
    db.promptSuggestionState.upsert({
      where: { userId },
      create: {
        userId,
        generationToken,
        generationStatus: "IDLE",
        model: OLLAMA_MODEL,
        systemPrompt: buildSystemPrompt(PROMPT_QUEUE_TARGET),
        requestPrompt: null,
        contextHash: null,
        expiresAt: null,
        lastError: null
      },
      update: {
        generationToken,
        generationStatus: "IDLE",
        systemPrompt: buildSystemPrompt(PROMPT_QUEUE_TARGET),
        requestPrompt: null,
        contextHash: null,
        lastError: null,
        expiresAt: null,
        generationStartedAt: null,
        generationFinishedAt: null
      }
    })
  ]);
}

async function deleteExpiredPromptQueue(userId: string) {
  await db.$transaction([
    db.promptSuggestion.deleteMany({ where: { userId } }),
    db.promptSuggestionState.update({
      where: { userId },
      data: {
        generationStatus: "IDLE",
        expiresAt: null,
        generationStartedAt: null,
        generationFinishedAt: null
      }
    })
  ]);
}

export async function consumePromptSuggestion(userId: string) {
  const state = await ensurePromptState(userId);

  if (state.expiresAt && state.expiresAt <= new Date()) {
    await deleteExpiredPromptQueue(userId);
    void schedulePromptSuggestionGeneration(userId, "replace");
    throw status(503, { message: "Prompt suggestions are still being generated" });
  }

  const next = await db.promptSuggestion.findFirst({
    where: { userId },
    orderBy: { position: "asc" }
  });

  if (!next) {
    void schedulePromptSuggestionGeneration(userId, "replace");
    throw status(503, { message: "Prompt suggestions are still being generated" });
  }

  await db.promptSuggestion.delete({ where: { id: next.id } });

  const remaining = await db.promptSuggestion.count({ where: { userId } });
  if (remaining < PROMPT_PREEMPTIVE_THRESHOLD) {
    void schedulePromptSuggestionGeneration(userId, "topup");
  }

  return { prompt: next.prompt };
}

export async function getPromptSuggestionDebugState(userId: string) {
  const [state, prompts] = await Promise.all([
    ensurePromptState(userId),
    db.promptSuggestion.findMany({
      where: { userId },
      orderBy: { position: "asc" },
      select: { prompt: true, position: true, createdAt: true }
    })
  ]);

  return {
    generationStatus: state.generationStatus,
    queuedGenerationMode: generationControllers.get(userId)?.queuedMode ?? null,
    queueLength: prompts.length,
    queueTarget: PROMPT_QUEUE_TARGET,
    preemptiveThreshold: PROMPT_PREEMPTIVE_THRESHOLD,
    model: state.model ?? OLLAMA_MODEL,
    systemPrompt: state.systemPrompt ?? buildSystemPrompt(PROMPT_QUEUE_TARGET),
    requestPrompt: state.requestPrompt,
    contextHash: state.contextHash,
    lastError: state.lastError,
    expiresAt: state.expiresAt?.toISOString() ?? null,
    generationStartedAt: state.generationStartedAt?.toISOString() ?? null,
    generationFinishedAt: state.generationFinishedAt?.toISOString() ?? null,
    prompts: prompts.map((prompt) => ({
      id: prompt.position,
      prompt: prompt.prompt,
      createdAt: prompt.createdAt.toISOString()
    }))
  };
}

export async function warmPromptSuggestionCache(userId: string) {
  await ensurePromptState(userId);
  return schedulePromptSuggestionGeneration(userId, "replace");
}

export async function invalidatePromptSuggestionCache(userId: string) {
  await preparePromptSuggestionRefresh(userId);
}

export async function refreshPromptSuggestionCache(userId: string) {
  await invalidatePromptSuggestionCache(userId);
  return schedulePromptSuggestionGeneration(userId, "replace");
}
