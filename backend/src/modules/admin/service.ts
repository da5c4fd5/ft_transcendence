import { status } from "elysia";
import { PrismaClientKnownRequestError } from "@prisma/client/runtime/client";
import { db } from "../../db";
import {
  collectUserOwnedFileUrls,
  deleteStoredFilesIfUnused
} from "../../lib/stored-files";
import type { AdminModel } from "./model";
import { MemoriesService } from "../memories/service";

const ADMIN_USER_SELECT = {
  id: true,
  username: true,
  email: true,
  avatarUrl: true,
  isAdmin: true,
  createdAt: true,
  updatedAt: true
} as const;

export abstract class AdminService {
  private static async assertNotRemovingLastAdmin(userId: string) {
    const target = await db.user.findUnique({
      where: { id: userId },
      select: { isAdmin: true }
    });
    if (!target?.isAdmin) return;

    const adminCount = await db.user.count({ where: { isAdmin: true } });
    if (adminCount <= 1) {
      throw status(400, { message: "At least one admin must remain" });
    }
  }

  static async getStats() {
    const [userCount, memoryCount, sessionCount] = await Promise.all([
      db.user.count(),
      db.memory.count(),
      db.session.count()
    ]);
    return { userCount, memoryCount, sessionCount };
  }

  static async getAiOverview() {
    const [
      totalStoredPrompts,
      usersWithStoredPromptRows,
      idlePromptStates,
      generatingPromptStates,
      readyPromptStates,
      errorPromptStates,
      promptStateSystemPrompts,
      recentPromptErrors,
      totalMoodJobs,
      queuedMoodJobs,
      processingMoodJobs,
      completedMoodJobs,
      failedMoodJobs,
      recentMoodFailures
    ] = await Promise.all([
      db.promptSuggestion.count(),
      db.promptSuggestion.groupBy({
        by: ["userId"]
      }),
      db.promptSuggestionState.count({
        where: { generationStatus: "IDLE" }
      }),
      db.promptSuggestionState.count({
        where: { generationStatus: "GENERATING" }
      }),
      db.promptSuggestionState.count({
        where: { generationStatus: "READY" }
      }),
      db.promptSuggestionState.count({
        where: { generationStatus: "ERROR" }
      }),
      db.promptSuggestionState.findMany({
        where: { systemPrompt: { not: null } },
        select: {
          userId: true,
          model: true,
          systemPrompt: true,
          updatedAt: true
        }
      }),
      db.promptSuggestionState.findMany({
        where: { lastError: { not: null } },
        orderBy: { updatedAt: "desc" },
        take: 8,
        select: {
          userId: true,
          lastError: true,
          updatedAt: true,
          user: {
            select: { username: true }
          }
        }
      }),
      db.moodClassificationJob.count(),
      db.moodClassificationJob.count({
        where: { status: "QUEUED" }
      }),
      db.moodClassificationJob.count({
        where: { status: "PROCESSING" }
      }),
      db.moodClassificationJob.count({
        where: { status: "COMPLETED" }
      }),
      db.moodClassificationJob.count({
        where: { status: "FAILED" }
      }),
      db.moodClassificationJob.findMany({
        where: { status: "FAILED" },
        orderBy: { updatedAt: "desc" },
        take: 8,
        select: {
          id: true,
          memoryId: true,
          userId: true,
          lastError: true,
          updatedAt: true,
          user: {
            select: { username: true }
          }
        }
      })
    ]);

    const promptSystemPromptMap = new Map<string, {
      model: string;
      prompt: string;
      usersCount: number;
      updatedAt: string;
    }>();

    for (const item of promptStateSystemPrompts) {
      if (!item.systemPrompt) continue;
      const key = `${item.model ?? ""}\u0000${item.systemPrompt}`;
      const existing = promptSystemPromptMap.get(key);
      if (!existing) {
        promptSystemPromptMap.set(key, {
          model: item.model ?? "",
          prompt: item.systemPrompt,
          usersCount: 1,
          updatedAt: item.updatedAt.toISOString()
        });
        continue;
      }

      existing.usersCount += 1;
      if (item.updatedAt.toISOString() > existing.updatedAt) {
        existing.updatedAt = item.updatedAt.toISOString();
      }
    }

    const systemPrompts = [...promptSystemPromptMap.values()].sort((a, b) =>
      b.updatedAt.localeCompare(a.updatedAt)
    );

    return {
      promptSuggestions: {
        totalStoredPrompts,
        usersWithStoredPrompts: usersWithStoredPromptRows.length,
        generationStatusCounts: {
          idle: idlePromptStates,
          generating: generatingPromptStates,
          ready: readyPromptStates,
          error: errorPromptStates
        },
        systemPrompts,
        recentErrors: recentPromptErrors.map((item) => ({
          userId: item.userId,
          username: item.user.username,
          lastError: item.lastError ?? "",
          updatedAt: item.updatedAt.toISOString()
        }))
      },
      moodClassification: {
        totalJobs: totalMoodJobs,
        statusCounts: {
          queued: queuedMoodJobs,
          processing: processingMoodJobs,
          completed: completedMoodJobs,
          failed: failedMoodJobs
        },
        recentFailures: recentMoodFailures.map((item) => ({
          jobId: item.id,
          memoryId: item.memoryId,
          userId: item.userId,
          username: item.user.username,
          lastError: item.lastError ?? "",
          updatedAt: item.updatedAt.toISOString()
        }))
      }
    };
  }

  static async listUsers(page: number, limit: number) {
    const [items, total] = await Promise.all([
      db.user.findMany({
        select: ADMIN_USER_SELECT,
        orderBy: { createdAt: "desc" },
        skip: (page - 1) * limit,
        take: limit
      }),
      db.user.count()
    ]);
    return { items, total, page, limit };
  }

  static async deleteUser(id: string) {
    const user = await db.user.findUnique({ where: { id } });
    if (!user) throw status(404, { message: "User not found" });
    await AdminService.assertNotRemovingLastAdmin(id);
    const ownedFileUrls = await collectUserOwnedFileUrls(id);
    await db.user.delete({ where: { id } });
    await deleteStoredFilesIfUnused(ownedFileUrls);
    return status(204);
  }

  static async updateUser(id: string, data: AdminModel["updateUserBody"]) {
    const user = await db.user.findUnique({ where: { id } });
    if (!user) throw status(404, { message: "User not found" });
    if (data.isAdmin === false) {
      await AdminService.assertNotRemovingLastAdmin(id);
    }
    try {
      return await db.user.update({
        where: { id },
        data,
        select: ADMIN_USER_SELECT
      });
    } catch (error) {
      if (
        error instanceof PrismaClientKnownRequestError &&
        error.code === "P2002"
      ) {
        throw status(409, { message: "That value is already in use" });
      }
      throw error;
    }
  }

  static async createMemory(data: AdminModel["createMemoryBody"]) {
    const user = await db.user.findUnique({
      where: { id: data.userId },
      select: { id: true }
    });
    if (!user) throw status(404, { message: "User not found" });

    return MemoriesService.createForUser(data.userId, {
      content: data.content,
      date: data.date,
      isOpen: data.isOpen ?? false
    });
  }

  static async attachMemoryMedia(memoryId: string, file: File) {
    const memory = await db.memory.findUnique({
      where: { id: memoryId },
      select: { id: true, userId: true }
    });
    if (!memory) throw status(404, { message: "Memory not found" });

    return MemoriesService.attachMediaForUser(memoryId, memory.userId, file, {
      skipDateRestriction: true
    });
  }
}
