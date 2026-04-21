import { status } from "elysia";
import { createId } from "@paralleldrive/cuid2";
import { db } from "../../db";
import type { MemoriesModel } from "./model";

function getLocalDayRange(reference = new Date()) {
  const start = new Date(reference);
  start.setHours(0, 0, 0, 0);

  const end = new Date(start);
  end.setDate(start.getDate() + 1);

  return { start, end };
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

    return db.memory.create({
      data: {
        userId,
        content: data.content,
        isOpen: data.isOpen ?? false,
        date,
        mood: data.mood,
        ...(data.isOpen ? { shareToken: createId() } : {})
      }
    });
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

    return db.memory.update({
      where: { id },
      data: { ...data, ...(shareToken ? { shareToken } : {}) }
    });
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
          include: { contributor: { select: { username: true, avatarUrl: true } } }
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
    await db.memory.delete({ where: { id } });
    return status(204);
  }

  static async attachMedia(id: string, userId: string, file: File) {
    const memory = await db.memory.findUnique({ where: { id } });
    if (!memory) throw status(404, { message: "Memory not found" });
    if (memory.userId !== userId) throw status(403, { message: "Forbidden" });

    // Delete any existing media record so the new one becomes the single reference
    await db.media.deleteMany({ where: { memoryId: id } });

    const ext = (file.type.split("/")[1] ?? "bin").replace("jpeg", "jpg");
    const filename = `${crypto.randomUUID()}.${ext}`;
    const uploadDir = "/app/uploads";
    await Bun.write(`${uploadDir}/${filename}`, await file.arrayBuffer());

    const url = `/api/media/${filename}`;
    return db.media.create({
      data: { memoryId: id, url, mimeType: file.type }
    });
  }

  static async deleteMedia(id: string, userId: string) {
    const memory = await db.memory.findUnique({ where: { id } });
    if (!memory) throw status(404, { message: "Memory not found" });
    if (memory.userId !== userId) throw status(403, { message: "Forbidden" });
    await db.media.deleteMany({ where: { memoryId: id } });
  }

  static async getPromptSuggestions() {
    return [
      "What made you smile today?",
      "Describe a moment you want to remember forever.",
      "What are you grateful for this week?"
    ];
  }

  static async getTimeline(
    userId: string,
    query: { page: number; limit: number }
  ) {
    return MemoriesService.list(userId, query);
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

  static async search(userId: string, query: MemoriesModel["searchQuery"]) {
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

    return db.memory.findMany({
      where: {
        userId,
        ...(query.mood ? { mood: query.mood } : {}),
        ...(query.sharedOnly ? { isOpen: true } : {}),
        ...(dateFilter ? { date: dateFilter } : {})
      },
      orderBy: { date: "desc" },
      take: query.limit ?? 20,
      include: { media: true }
    });
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
}
