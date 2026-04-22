import { status } from "elysia";
import { db } from "../../db";
import { MemoriesService } from "../memories/service";
import type { PublicApiModel } from "./model";

function toPublicMemory(memory: {
  id: string;
  content: string;
  date: Date;
  isOpen: boolean;
  shareToken: string | null;
  createdAt: Date;
  updatedAt: Date;
  media: { url: string }[];
}) {
  return {
    id: memory.id,
    content: memory.content,
    date: memory.date.toISOString().split("T")[0],
    isOpen: memory.isOpen,
    shareToken: memory.shareToken,
    mediaUrl: memory.media[0]?.url ?? null,
    createdAt: memory.createdAt.toISOString(),
    updatedAt: memory.updatedAt.toISOString()
  };
}

export abstract class PublicApiService {
  static getProfile(user: { userId: string; username: string; email: string }) {
    return {
      id: user.userId,
      username: user.username,
      email: user.email
    };
  }

  static async listMemories(
    userId: string,
    query: PublicApiModel["paginationQuery"]
  ) {
    const page = query.page ?? 1;
    const limit = query.limit ?? 20;
    const [items, total] = await Promise.all([
      db.memory.findMany({
        where: { userId },
        include: { media: true },
        orderBy: { date: "desc" },
        skip: (page - 1) * limit,
        take: limit
      }),
      db.memory.count({ where: { userId } })
    ]);

    return {
      items: items.map(toPublicMemory),
      total,
      page,
      limit
    };
  }

  static async findMemory(userId: string, memoryId: string) {
    const memory = await db.memory.findFirst({
      where: {
        id: memoryId,
        userId
      },
      include: { media: true }
    });

    if (!memory) {
      throw status(404, { message: "Memory not found" });
    }

    return toPublicMemory(memory);
  }

  static async createMemory(
    userId: string,
    body: PublicApiModel["createMemoryBody"]
  ) {
    const created = await MemoriesService.create(userId, body);
    const memory = await db.memory.findUniqueOrThrow({
      where: { id: created.id },
      include: { media: true }
    });
    return toPublicMemory(memory);
  }

  static async replaceMemory(
    userId: string,
    memoryId: string,
    body: PublicApiModel["replaceMemoryBody"]
  ) {
    await MemoriesService.update(memoryId, userId, body);
    const memory = await db.memory.findUniqueOrThrow({
      where: { id: memoryId },
      include: { media: true }
    });
    return toPublicMemory(memory);
  }

  static deleteMemory(userId: string, memoryId: string) {
    return MemoriesService.delete(memoryId, userId);
  }
}
