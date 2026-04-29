import { createHash } from "crypto";
import { db } from "../db";

const OLLAMA_BASE_URL = process.env.OLLAMA_BASE_URL ?? "http://ollama:11434";
const OLLAMA_MODEL = process.env.OLLAMA_MODEL ?? "qwen3:4b-instruct-2507-q4_K_M";
const WELLNESS_TIP_COUNT = 3;
const WELLNESS_HISTORY_LIMIT = 24;
const WELLNESS_CACHE_TTL_MS = 6 * 60 * 60 * 1000;
const WELLNESS_GENERATION_TIMEOUT_MS = 90_000;
const WELLNESS_TIP_MIN_CHARS = 20;
const WELLNESS_TIP_MAX_CHARS = 64;
const WELLNESS_MAX_ATTEMPTS = 4;
const WELLNESS_STYLE_LANES = [
  "a grounding tip based on what felt good or safe",
  "a reflective tip that helps carry today into tomorrow",
  "a gentle behavioral tip for emotional balance"
] as const;
const GENERIC_TIP_PATTERNS = [
  /\btake (a |some )?(short )?walks?\b/i,
  /\bnotice (small )?moments of (calm|peace)\b/i,
  /\bnotice how you feel\b/i,
  /\bnotice how small moments\b/i,
  /\bsimplif(y|y your|y the) evenings?\b/i,
  /\bavoid(ing)? screens before bed/i,
  /\bavoid(ing)? overstimulation before bed/i,
  /\bslow down\b/i,
  /\btake a break\b/i,
  /\bbreathe deeply\b/i,
  /\bdrink water\b/i,
  /\bget fresh air\b/i,
  /\bquiet evening\b/i,
  /\breset your mood\b/i,
  /\breset your energy\b/i,
  /\boverall well-being\b/i,
  /\btouch your\b/i,
  /\bsmell\b/i,
  /\blemon\b/i,
  /\bplant\b/i,
  /\bshoe\b/i,
  /\bblink slowly\b/i,
  /\bask someone\b/i,
  /\bvisit your\b/i,
  /\bcorner\b/i
] as const;
const COMMON_HISTORY_WORDS = new Set([
  "about",
  "after",
  "again",
  "around",
  "because",
  "before",
  "being",
  "calmer",
  "could",
  "during",
  "evening",
  "every",
  "felt",
  "feel",
  "from",
  "having",
  "keeping",
  "little",
  "quiet",
  "really",
  "simple",
  "small",
  "taking",
  "through",
  "today",
  "walk",
  "while",
  "with",
  "without"
]);
const WELLNESS_FALLBACK_BANK: Record<(typeof WELLNESS_STYLE_LANES)[number], readonly string[]> = {
  "a grounding tip based on what felt good or safe": [
    "Keep one good detail from today ready for tomorrow.",
    "Return to the calmest moment of today before sleep.",
    "Name what felt safe today and look for it again."
  ],
  "a reflective tip that helps carry today into tomorrow": [
    "Write one line tonight about what you want to keep.",
    "Hold onto the best part of today for tomorrow morning.",
    "Ask what made today easier, then repeat just that."
  ],
  "a gentle behavioral tip for emotional balance": [
    "Plan one small comforting thing before tomorrow begins.",
    "Give tomorrow one easy win before anything demanding.",
    "Protect the mood of today with one simple next step."
  ]
};

type MemoryHistoryItem = {
  date: Date;
  content: string;
  mood: string | null;
};

type WellnessTipCacheEntry = {
  contextHash: string;
  expiresAt: number;
  tips: string[];
};

const cache = new Map<string, WellnessTipCacheEntry>();
const generationControllers = new Map<string, Promise<string[]>>();

function normalizeWhitespace(value: string) {
  return value.replace(/\s+/g, " ").trim();
}

function sanitizeTip(value: string) {
  return normalizeWhitespace(
    value
      .replace(/^[-*0-9.)\s"'`]+/, "")
      .replace(/^tip:\s*/i, "")
  );
}

function uniqueTips(tips: string[]) {
  const seen = new Set<string>();
  return tips.filter((tip) => {
    const key = tip.toLowerCase();
    if (!tip || seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}

function shuffle<T>(items: readonly T[]) {
  const shuffled = [...items];
  for (let i = shuffled.length - 1; i > 0; i -= 1) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  return shuffled;
}

function fallbackWellnessTips(memories: MemoryHistoryItem[]) {
  const historyText = memories
    .map((memory) => normalizeWhitespace(memory.content).toLowerCase())
    .join(" ");
  const prefersEvening = /\bevening|night|bed|sleep|late\b/.test(historyText);
  const lanes = shuffle(WELLNESS_STYLE_LANES).slice(0, WELLNESS_TIP_COUNT);

  return lanes.map((lane, index) => {
    const options = [...WELLNESS_FALLBACK_BANK[lane]];
    const preferred = prefersEvening
      ? options.find((option) => /\btonight|evening|bed\b/i.test(option))
      : undefined;
    const selected = preferred ?? options[index % options.length] ?? options[0];
    return selected;
  });
}

function extractProminentHistoryWords(memories: MemoryHistoryItem[]) {
  const counts = new Map<string, number>();

  for (const memory of memories) {
    for (const word of normalizeWhitespace(memory.content).toLowerCase().match(/[a-z]{5,}/g) ?? []) {
      if (COMMON_HISTORY_WORDS.has(word)) continue;
      counts.set(word, (counts.get(word) ?? 0) + 1);
    }
  }

  return [...counts.entries()]
    .sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0]))
    .slice(0, 8)
    .map(([word]) => word);
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

async function loadMemoryHistory(userId: string) {
  return db.memory.findMany({
    where: { userId },
    orderBy: { date: "desc" },
    take: WELLNESS_HISTORY_LIMIT,
    select: {
      date: true,
      content: true,
      mood: true
    }
  });
}

async function safeLoadMemoryHistory(userId: string) {
  try {
    return await loadMemoryHistory(userId);
  } catch (error) {
    console.error("Failed to load memory history for wellness tips", error);
    return [] as MemoryHistoryItem[];
  }
}

function buildSystemPrompt(styleLanes: readonly string[]) {
  return `You generate gentle wellness tips for a private daily memory journal.

Return JSON only with this exact shape:
{"tips":["tip 1","tip 2","tip 3"]}

Your task:
- generate exactly ${WELLNESS_TIP_COUNT} short wellness suggestions
- act like a warm, thoughtful psychotherapist giving brief daily guidance
- keep them supportive, practical, emotionally safe, and clearly linked to the memories
- base them only on patterns that are explicit in the user's recent memories

Hard rules:
- each tip must be a single sentence in English
- English only. Do not output any other language.
- each tip must be between ${WELLNESS_TIP_MIN_CHARS} and ${WELLNESS_TIP_MAX_CHARS} characters
- each tip must fit on a single short line
- each tip must address only the user
- each tip must be actionable, gentle, and concrete
- each tip must feel grounded and sincere, never whimsical
- do not diagnose, label, or mention disorders
- do not mention therapy, medication, trauma, abuse, or crisis services unless explicitly present
- do not invent events, relationships, or problems
- explicitly reference specific recent memories when relevant — name a concrete detail, moment, or feeling from the history so the tip feels personal
- do not use markdown, numbering, headings, or explanations
- avoid duplicates and near-duplicates
- prefer emotional carry-over, reflection, reassurance, or one realistic next step
- reuse concrete details that are explicitly present in the memories
- never invent random props, rituals, scents, clothing, plants, or body-part actions
- never sound quirky, surreal, cute, or performative
- never ask the user to do something bizarre just to seem original

Required style lanes:
- tip 1 should feel like ${styleLanes[0]}
- tip 2 should feel like ${styleLanes[1]}
- tip 3 should feel like ${styleLanes[2]}

Avoid bland phrasing such as:
- take a walk
- notice calm
- take a break
- slow down
- breathe deeply
- drink water
- get fresh air

Bad examples:
- Touch your left shoe corner when you feel a happy shift.
- Smell lemon oil for one second, then blink slowly.
- Ask someone you like: "Can I visit your plant later?"

Good examples:
- Keep one good part of today in mind before tomorrow starts.
- If school feels big tomorrow, begin with one familiar comfort.
- Let today's easy connection remind you that new places can soften.

Before finalizing, reject any tip that:
- assumes facts not present in the history
- sounds alarming or overly clinical
- feels generic enough to ignore the history
- could fit almost anyone without changing a word
- repeats another tip too closely
- sounds like random AI-generated whimsy instead of real support`;
}

function buildRequestPrompt(memories: MemoryHistoryItem[], styleLanes: readonly string[]) {
  const prominentWords = extractProminentHistoryWords(memories);
  if (memories.length === 0) {
    return [
      "Recent memory history: none yet.",
      "",
      "Generate gentle starter wellness tips for someone beginning a daily journal.",
      "Keep them practical, calm, and easy to follow.",
      `Use these three angles: ${styleLanes.join(", ")}.`
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
    "Silently identify the clearest recurring emotional and lifestyle patterns.",
    "Generate gentle wellness suggestions that fit those patterns.",
    "Stay practical, supportive, and emotionally intelligent.",
    "Keep each tip immediately useful in everyday life.",
    "Focus on reassurance, emotional continuity, and one realistic next step.",
    "Do not simply repeat the obvious action already present in the memories.",
    "Prefer grounded therapist-style advice over quirky creativity.",
    prominentWords.length > 0
      ? `Avoid reusing these obvious history words unless necessary: ${prominentWords.join(", ")}.`
      : "Avoid reusing the most obvious wording from the memories.",
    `Use these three angles in order: ${styleLanes.join(", ")}.`
  ].join("\n");
}

function parseGeneratedTips(raw: unknown) {
  if (typeof raw !== "string" || !raw.trim()) return [];

  const trimmed = raw.trim();
  try {
    const parsed = JSON.parse(trimmed) as { tips?: unknown } | unknown[];
    if (Array.isArray(parsed)) {
      return parsed.filter((item): item is string => typeof item === "string");
    }
    if (
      parsed &&
      typeof parsed === "object" &&
      Array.isArray((parsed as { tips?: unknown }).tips)
    ) {
      return (parsed as { tips: unknown[] }).tips.filter(
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

async function generateWellnessTips(memories: MemoryHistoryItem[]) {
  let lastError: Error | null = null;

  for (let attempt = 0; attempt < WELLNESS_MAX_ATTEMPTS; attempt += 1) {
    let response: Response;
    try {
      const styleLanes = shuffle(WELLNESS_STYLE_LANES).slice(0, WELLNESS_TIP_COUNT);
      response = await fetch(`${OLLAMA_BASE_URL}/api/generate`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        signal: AbortSignal.timeout(WELLNESS_GENERATION_TIMEOUT_MS),
        body: JSON.stringify({
          model: OLLAMA_MODEL,
          prompt: buildRequestPrompt(memories, styleLanes),
          system: buildSystemPrompt(styleLanes),
          stream: false,
          format: "json",
          keep_alive: -1,
          options: {
            temperature: 0.8,
            top_p: 0.9,
            repeat_penalty: 1.2
          }
        })
      });
    } catch (err) {
      lastError = err instanceof Error ? err : new Error(String(err));
      break;
    }

    if (!response.ok) {
      const responseText = normalizeWhitespace(await response.text());
      const detail = responseText ? `: ${responseText.slice(0, 240)}` : "";
      lastError = new Error(`Ollama returned ${response.status}${detail}`);
      break;
    }

    const payload = await response.json() as { response?: unknown };
    const tips = uniqueTips(
      parseGeneratedTips(payload.response)
        .map(sanitizeTip)
        .filter(
          (tip) =>
            tip.length >= WELLNESS_TIP_MIN_CHARS &&
            tip.length <= WELLNESS_TIP_MAX_CHARS &&
            !GENERIC_TIP_PATTERNS.some((pattern) => pattern.test(tip))
        )
    ).slice(0, WELLNESS_TIP_COUNT);

    if (tips.length === WELLNESS_TIP_COUNT) {
      return tips;
    }

    lastError = new Error("Ollama returned generic wellness tips");
  }

  if (lastError) {
    console.warn("Falling back to curated wellness tips", lastError.message);
  }
  return fallbackWellnessTips(memories);
}

async function buildWellnessTips(userId: string) {
  const memories = await loadMemoryHistory(userId);
  const contextHash = buildContextHash(memories);
  const tips = await generateWellnessTips(memories);
  cache.set(userId, {
    contextHash,
    tips,
    expiresAt: Date.now() + WELLNESS_CACHE_TTL_MS
  });
  return tips;
}

export function invalidateWellnessTipCache(userId: string) {
  cache.delete(userId);
}

export async function getWellnessTips(userId: string, options?: { refresh?: boolean }) {
  const memories = await safeLoadMemoryHistory(userId);
  const contextHash = buildContextHash(memories);
  const cached = cache.get(userId);
  const refresh = options?.refresh === true;

  if (
    !refresh &&
    cached &&
    cached.expiresAt > Date.now() &&
    cached.contextHash === contextHash
  ) {
    return { tips: cached.tips };
  }

  const existing = generationControllers.get(userId);
  if (existing) {
    try {
      return { tips: await existing };
    } catch (error) {
      console.warn("Wellness tip generation failed (existing)", error);
      const tips = fallbackWellnessTips(memories);
      cache.set(userId, {
        contextHash,
        tips,
        expiresAt: Date.now() + WELLNESS_CACHE_TTL_MS
      });
      return { tips };
    }
  }

  const generation = buildWellnessTips(userId)
    .catch((error) => {
      console.error("Failed to generate wellness tips", error);
      const tips = fallbackWellnessTips(memories);
      cache.set(userId, {
        contextHash,
        tips,
        expiresAt: Date.now() + WELLNESS_CACHE_TTL_MS
      });
      return tips;
    })
    .finally(() => {
      generationControllers.delete(userId);
    });
  generationControllers.set(userId, generation);

  return { tips: await generation };
}
