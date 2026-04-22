import { status } from "elysia";
import { createId } from "@paralleldrive/cuid2";
import { db } from "../../db";
import type { MemoriesModel } from "./model";
import { consumePromptSuggestion, refreshPromptSuggestionCache } from "../../lib/prompt-suggestions";
import { enqueueMoodClassification } from "../../lib/mood-classifier";
import { assertMemoryMediaFile } from "../../lib/images";
import {
  collectMemoryFileUrls,
  deleteStoredFilesIfUnused
} from "../../lib/stored-files";

const REMINDER_CACHE_TTL_MS = 5 * 60 * 1000;
const REMINDER_POOL_LIMIT = 24;

type ReminderMemory = {
  id: string;
  date: Date;
  content: string;
  mood: string | null;
};

type GameMemory = {
  id: string;
  date: Date;
  content: string;
  media: { url: string }[];
};

const reminderCache = new Map<
  string,
  { expiresAt: number; items: ReminderMemory[] }
>();

function getLocalDayRange(reference = new Date()) {
  const start = new Date(reference);
  start.setHours(0, 0, 0, 0);

  const end = new Date(start);
  end.setDate(start.getDate() + 1);

  return { start, end };
}

function shuffle<T>(items: T[]) {
  const shuffled = [...items];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  return shuffled;
}

function extensionForMime(mimeType: string) {
  const subtype = mimeType.split("/")[1] ?? "bin";
  return subtype.replace("jpeg", "jpg").replace(/[^a-z0-9]/gi, "") || "bin";
}

function assertMemoryCanBeModifiedToday(memoryDate: Date) {
  const { start, end } = getLocalDayRange();
  if (memoryDate < start || memoryDate >= end) {
    throw status(403, {
      message: "Only today's memory can be updated or deleted"
    });
  }
}

export abstract class MemoriesService {
  static invalidateReminderCache(userId: string) {
    reminderCache.delete(userId);
  }

  static getPromptSuggestions(userId: string) {
    return consumePromptSuggestion(userId);
  }

  static async list(userId: string, query: { page: number; limit: number }) {
    const [items, total] = await Promise.all([
      db.memory.findMany({
        where: { userId },
        orderBy: { date: "desc" },
        skip: (query.page - 1) * query.limit,
        take: query.limit,
        include: { media: true }
      }),
      db.memory.count({ where: { userId } })
    ]);
    return { items, total, page: query.page, limit: query.limit };
  }

  static async findById(id: string, userId: string) {
    const memory = await db.memory.findUnique({
      where: { id },
      include: { media: true }
    });
    if (!memory) throw status(404, { message: "Memory not found" });
    if (!memory.isOpen && memory.userId !== userId)
      throw status(403, { message: "Forbidden" });
    return memory;
  }

  static async create(userId: string, data: MemoriesModel["createBody"]) {
    const date = data.date ? new Date(data.date) : new Date();
    date.setHours(0, 0, 0, 0);
    const { end: nextDay } = getLocalDayRange(date);

    const existing = await db.memory.findFirst({
      where: { userId, date: { gte: date, lt: nextDay } }
    });
    if (existing) throw status(409, { message: "You already have a memory for today" });

    const memory = await db.memory.create({
      data: {
        userId,
        content: data.content,
        isOpen: data.isOpen ?? false,
        date,
        ...(data.isOpen ? { shareToken: createId() } : {})
      }
    });
    MemoriesService.invalidateReminderCache(userId);
    void refreshPromptSuggestionCache(userId);
    void enqueueMoodClassification(userId, memory.id, memory.content);
    return memory;
  }

  static async update(
    id: string,
    userId: string,
    data: MemoriesModel["updateBody"]
  ) {
    const memory = await db.memory.findUnique({ where: { id } });
    if (!memory) throw status(404, { message: "Memory not found" });
    if (memory.userId !== userId) throw status(403, { message: "Forbidden" });
    assertMemoryCanBeModifiedToday(memory.date);

    // Generate a share token when opening for the first time
    const shareToken =
      data.isOpen === true && !memory.shareToken
        ? createId()
        : undefined;
    const updateData: Parameters<typeof db.memory.update>[0]["data"] = {
      ...data,
      ...(shareToken ? { shareToken } : {})
    };

    if (data.content !== undefined) {
      updateData.mood = null;
      updateData.moodSource = null;
    }

    const updated = await db.memory.update({
      where: { id },
      data: updateData
    });
    MemoriesService.invalidateReminderCache(userId);
    void refreshPromptSuggestionCache(userId);
    if (data.content !== undefined) {
      void enqueueMoodClassification(userId, id, updated.content);
    }
    return updated;
  }

  static async today(userId: string) {
    const { start: date, end: nextDay } = getLocalDayRange();

    const memory = await db.memory.findFirst({
      where: { userId, date: { gte: date, lt: nextDay } },
      include: { media: true }
    });
    if (!memory) throw status(404, { message: "No memory for today" });
    return memory;
  }

  static async findByShareToken(memoryId: string, shareToken: string) {
    const memory = await db.memory.findUnique({
      where: { id: memoryId },
      include: {
        media: true,
        contributions: {
          orderBy: { createdAt: "asc" },
          include: {
            contributor: { select: { id: true, username: true, avatarUrl: true } }
          }
        },
        user: { select: { username: true } }
      }
    });
    if (!memory || memory.shareToken !== shareToken)
      throw status(404, { message: "Memory not found" });
    if (!memory.isOpen) throw status(403, { message: "This memory is not shared" });
    return memory;
  }

  static async delete(id: string, userId: string) {
    const memory = await db.memory.findUnique({ where: { id } });
    if (!memory) throw status(404, { message: "Memory not found" });
    if (memory.userId !== userId) throw status(403, { message: "Forbidden" });
    assertMemoryCanBeModifiedToday(memory.date);
    const memoryFileUrls = await collectMemoryFileUrls(id);
    await db.memory.delete({ where: { id } });
    await deleteStoredFilesIfUnused(memoryFileUrls);
    MemoriesService.invalidateReminderCache(userId);
    void refreshPromptSuggestionCache(userId);
    return status(204);
  }

  static async attachMedia(id: string, userId: string, file: File) {
    const memory = await db.memory.findUnique({ where: { id } });
    if (!memory) throw status(404, { message: "Memory not found" });
    if (memory.userId !== userId) throw status(403, { message: "Forbidden" });
    assertMemoryCanBeModifiedToday(memory.date);
    assertMemoryMediaFile(file);

    // Delete any existing media record so the new one becomes the single reference
    const previousMedia = await db.media.findMany({
      where: { memoryId: id },
      select: { url: true }
    });
    await db.media.deleteMany({ where: { memoryId: id } });

    const ext = extensionForMime(file.type);
    const filename = `${crypto.randomUUID()}.${ext}`;
    const uploadDir = "/app/uploads";
    await Bun.write(`${uploadDir}/${filename}`, await file.arrayBuffer());

    const url = `/api/media/${filename}`;
    const media = await db.media.create({
      data: { memoryId: id, url, mimeType: file.type }
    });
    await deleteStoredFilesIfUnused(previousMedia.map((item) => item.url));
    MemoriesService.invalidateReminderCache(userId);
    return media;
  }

  static async deleteMedia(id: string, userId: string) {
    const memory = await db.memory.findUnique({ where: { id } });
    if (!memory) throw status(404, { message: "Memory not found" });
    if (memory.userId !== userId) throw status(403, { message: "Forbidden" });
    assertMemoryCanBeModifiedToday(memory.date);
    const previousMedia = await db.media.findMany({
      where: { memoryId: id },
      select: { url: true }
    });
    await db.media.deleteMany({ where: { memoryId: id } });
    await deleteStoredFilesIfUnused(previousMedia.map((item) => item.url));
    MemoriesService.invalidateReminderCache(userId);
    return status(204);
  }

  static async getTimeline(
    userId: string,
    query: { page: number; limit: number }
  ) {
    return MemoriesService.list(userId, query);
  }

  static async getGameMemories(userId: string, count: number) {
    const memories = await db.memory.findMany({
      where: { userId },
      include: {
        media: {
          orderBy: { createdAt: "asc" },
          take: 1
        }
      }
    });

    return shuffle(memories as GameMemory[])
      .slice(0, count)
      .map((memory) => ({
        id: memory.id,
        date: memory.date.toISOString().split("T")[0],
        content: memory.content,
        mediaUrl: memory.media[0]?.url ?? null
      }));
  }

  static async getLifeCalendar(userId: string) {
    const memories = await db.memory.findMany({
      where: { userId },
      select: { id: true, date: true, mood: true },
      orderBy: { date: "asc" }
    });
    return memories.map(m => ({
      date: m.date.toISOString().split("T")[0],
      id:   m.id,
      mood: m.mood ?? null,
    }));
  }

  static async search(
    userId: string,
    query: MemoriesModel["searchQuery"],
    rawSearchParams?: URLSearchParams
  ) {
    const page = query.page ?? 1;
    const limit = query.limit ?? 20;
    const hasMeaningfulFilter = rawSearchParams
      ? ["mood", "period", "after", "before", "sharedOnly"].some((key) =>
          rawSearchParams.has(key)
        )
      : Boolean(
          query.mood ||
            query.period ||
            query.after ||
            query.before ||
            query.sharedOnly
        );

    if (!hasMeaningfulFilter) {
      return MemoriesService.list(userId, { page, limit });
    }

    let dateFilter: { gte?: Date; lte?: Date } | undefined;

    if (query.period && !query.after && !query.before) {
      const now = new Date();
      const gte = new Date(now);
      if (query.period === "week") gte.setDate(now.getDate() - 7);
      else if (query.period === "month") gte.setMonth(now.getMonth() - 1);
      else gte.setFullYear(now.getFullYear() - 1);
      dateFilter = { gte };
    } else if (query.after || query.before) {
      dateFilter = {
        gte: query.after ? new Date(query.after) : undefined,
        lte: query.before ? new Date(query.before) : undefined
      };
    }

    const where = {
      userId,
      ...(query.mood ? { mood: query.mood } : {}),
      ...(query.sharedOnly ? { isOpen: true } : {}),
      ...(dateFilter ? { date: dateFilter } : {})
    };
    const [items, total] = await Promise.all([
      db.memory.findMany({
        where,
        orderBy: { date: "desc" },
        skip: (page - 1) * limit,
        take: limit,
        include: { media: true }
      }),
      db.memory.count({ where })
    ]);

    return { items, total, page, limit };
  }

  static async getStats(userId: string) {
    const [totalCapsuls, shared, memories] = await Promise.all([
      db.memory.count({ where: { userId } }),
      db.memory.count({ where: { userId, isOpen: true } }),
      db.memory.findMany({
        where: { userId },
        select: { date: true, content: true },
        orderBy: { date: "desc" }
      })
    ]);

    // Consecutive-day streak counting back from today
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const memDates = new Set(
      memories.map((m) => m.date.toISOString().split("T")[0])
    );
    let dayStreak = 0;
    const cursor = new Date(today);
    while (memDates.has(cursor.toISOString().split("T")[0])) {
      dayStreak++;
      cursor.setDate(cursor.getDate() - 1);
    }

    const wordsWritten = memories.reduce(
      (sum, m) =>
        sum + m.content.trim().split(/\s+/).filter(Boolean).length,
      0
    );

    return { totalCapsuls, shared, dayStreak, wordsWritten };
  }

  /** Return 3 memories spread across the user's history for the capsule view. */
  static async getCapsuls(userId: string) {
    const total = await db.memory.count({ where: { userId } });
    if (total === 0) return [];

    const include = { media: true } as const;
    const picks = await Promise.all([
      db.memory.findFirst({
        where: { userId },
        orderBy: { date: "asc" },
        include
      }),
      db.memory.findFirst({
        where: { userId },
        orderBy: { date: "desc" },
        include
      }),
      total > 2
        ? db.memory.findFirst({
            where: { userId },
            orderBy: { date: "asc" },
            skip: Math.floor(total / 2),
            include
          })
        : Promise.resolve(null)
    ]);

    // Deduplicate and return up to 3
    const seen = new Set<string>();
    return picks.filter((m): m is NonNullable<typeof m> => {
      if (!m || seen.has(m.id)) return false;
      seen.add(m.id);
      return true;
    });
  }

  static async getReminders(userId: string, limit = 12) {
    const cached = reminderCache.get(userId);
    if (cached && cached.expiresAt > Date.now()) {
      return cached.items.slice(0, limit);
    }

    const { start: todayStart } = getLocalDayRange();
    const reminders = await db.memory.findMany({
      where: {
        userId,
        date: { lt: todayStart }
      },
      select: {
        id: true,
        date: true,
        content: true,
        mood: true
      },
      orderBy: { date: "desc" }
    });

    const items = shuffle(reminders).slice(0, REMINDER_POOL_LIMIT);
    reminderCache.set(userId, {
      expiresAt: Date.now() + REMINDER_CACHE_TTL_MS,
      items
    });
    return items.slice(0, limit);
  }
}
