import { status } from "elysia";
import { db } from "../../db";
import type { MemoriesModel } from "./model";

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
    return db.memory.create({
      data: {
        userId,
        content: data.content,
        isOpen: data.isOpen ?? false,
        date: data.date ? new Date(data.date) : new Date(),
        mood: data.mood
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
    return db.memory.update({ where: { id }, data });
  }

  static async delete(id: string, userId: string) {
    const memory = await db.memory.findUnique({ where: { id } });
    if (!memory) throw status(404, { message: "Memory not found" });
    if (memory.userId !== userId) throw status(403, { message: "Forbidden" });
    await db.memory.delete({ where: { id } });
    return { message: "Deleted" };
  }

  static async attachMedia(id: string, userId: string, file: File) {
    const memory = await db.memory.findUnique({ where: { id } });
    if (!memory) throw status(404, { message: "Memory not found" });
    if (memory.userId !== userId) throw status(403, { message: "Forbidden" });
    // TODO: persist file to disk/S3 and derive a real URL
    const url = `/media/${crypto.randomUUID()}`;
    return db.media.create({
      data: { memoryId: id, url, mimeType: file.type }
    });
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
}
