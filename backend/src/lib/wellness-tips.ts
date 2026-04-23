import { createHash } from "crypto";
import { status } from "elysia";
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
  "a tiny ritual",
  "a playful constraint",
  "a sensory reset",
  "a social boundary",
  "a body cue",
  "an environmental tweak",
  "an odd but harmless experiment",
  "a reflective question turned into action",
  "a quiet act of rebellion against overstimulation",
  "a micro habit for difficult evenings"
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
  /\boverall well-being\b/i
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
  "a tiny ritual": [
    "Pick one lamp tonight and let it set the whole tone.",
    "Choose one mug and make it your evening anchor.",
    "Open one window for exactly one quiet song."
  ],
  "a playful constraint": [
    "Put your phone out of reach for three full songs.",
    "Do tonight with one tab, one light, one drink.",
    "Let one app stay unopened until after dinner."
  ],
  "a sensory reset": [
    "Cool your wrists under water before the evening starts.",
    "Stand by a window until your jaw unclenches.",
    "Trade ceiling light for one softer light tonight."
  ],
  "a social boundary": [
    "Answer one message slower than your impulse wants.",
    "Leave one conversation on read until tomorrow morning.",
    "Keep one pocket of tonight unreachable to other people."
  ],
  "a body cue": [
    "Drop your shoulders every time you cross a doorway.",
    "Unclench your hands before you touch your phone again.",
    "Let your exhale finish before replying to anything."
  ],
  "an environmental tweak": [
    "Make one corner of the room noticeably dimmer tonight.",
    "Move one noisy object out of your sightline.",
    "Clear one small surface and defend it all evening."
  ],
  "an odd but harmless experiment": [
    "Do one ordinary task tonight in complete silence.",
    "Sit on the floor for five minutes before bed.",
    "Try one evening hour without the brightest light on."
  ],
  "a reflective question turned into action": [
    "When your mind speeds up, change rooms before the thought.",
    "If the evening feels loud, shrink it to one next step.",
    "When you feel scattered, choose one object and orbit it."
  ],
  "a quiet act of rebellion against overstimulation": [
    "Let one notification expire without earning your attention.",
    "Refuse one extra tab, light, or sound tonight.",
    "Leave one thing undone on purpose and survive it."
  ],
  "a micro habit for difficult evenings": [
    "Make the room smaller: one chair, one drink, one song.",
    "Start your evening by dimming one light immediately.",
    "Give tonight a border: pick one song to end it."
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

function buildSystemPrompt(styleLanes: readonly string[]) {
  return `You generate gentle wellness tips for a private daily memory journal.

Return JSON only with this exact shape:
{"tips":["tip 1","tip 2","tip 3"]}

Your task:
- generate exactly ${WELLNESS_TIP_COUNT} short wellness suggestions
- keep them supportive, practical, and emotionally safe
- base them only on patterns that are explicit in the user's recent memories

Hard rules:
- each tip must be a single sentence in English
- English only. Do not output any other language.
- each tip must be between ${WELLNESS_TIP_MIN_CHARS} and ${WELLNESS_TIP_MAX_CHARS} characters
- each tip must fit on a single short line
- each tip must address only the user
- each tip must be actionable, gentle, and concrete
- each tip must feel slightly surprising, vivid, or unconventional
- do not diagnose, label, or mention disorders
- do not mention therapy, medication, trauma, abuse, or crisis services unless explicitly present
- do not invent events, relationships, or problems
- do not mention the memory history directly
- do not use markdown, numbering, headings, or explanations
- avoid duplicates and near-duplicates

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

Before finalizing, reject any tip that:
- assumes facts not present in the history
- sounds alarming or overly clinical
- feels generic enough to ignore the history
- could fit almost anyone without changing a word
- repeats another tip too closely`;
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
    "Stay practical and supportive, not clinical.",
    "Keep each tip immediately useful in everyday life.",
    "Push for freshness and specificity over generic advice.",
    "Do not simply repeat the obvious action already present in the memories.",
    "Look sideways: propose adjacent, unexpected, harmless micro-actions.",
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
    const styleLanes = shuffle(WELLNESS_STYLE_LANES).slice(0, WELLNESS_TIP_COUNT);
    const response = await fetch(`${OLLAMA_BASE_URL}/api/generate`, {
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
          temperature: 1.25,
          top_p: 0.94,
          repeat_penalty: 1.25
        }
      })
    });

    if (!response.ok) {
      const responseText = normalizeWhitespace(await response.text());
      const detail = responseText ? `: ${responseText.slice(0, 240)}` : "";
      throw new Error(`Ollama returned ${response.status}${detail}`);
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
  const memories = await loadMemoryHistory(userId);
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
    } catch {
      throw status(503, {
        message: "Wellness tips are taking longer than expected. Try again in a moment."
      });
    }
  }

  const generation = buildWellnessTips(userId).finally(() => {
    generationControllers.delete(userId);
  });
  generationControllers.set(userId, generation);

  try {
    return { tips: await generation };
  } catch (error) {
    console.error("Failed to generate wellness tips", error);
    throw status(503, {
      message: "We could not generate wellness tips right now."
    });
  }
}
