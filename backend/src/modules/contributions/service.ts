import { status } from "elysia";
import { db } from "../../db";
import type { ContributionsModel } from "./model";

export abstract class ContributionsService {
  static async listByMemory(memoryId: string) {
    const memory = await db.memory.findUnique({ where: { id: memoryId } });
    if (!memory) throw status(404, { message: "Memory not found" });
    return db.contribution.findMany({
      where: { memoryId },
      orderBy: { createdAt: "asc" },
      include: { contributor: { omit: { passwordHash: true, mfaSecret: true, mfaPendingSecret: true } } }
    });
  }

  static async add(
    memoryId: string,
    data: ContributionsModel["addBody"],
    contributorId?: string
  ) {
    const memory = await db.memory.findUnique({ where: { id: memoryId } });
    if (!memory) throw status(404, { message: "Memory not found" });
    if (!memory.isOpen)
      throw status(403, {
        message: "This memory is not open for contributions"
      });
    return db.contribution.create({
      data: {
        memoryId,
        content: data.content,
        guestName: data.guestName,
        contributorId: contributorId ?? null
      }
    });
  }

  static async edit(
    id: string,
    requesterId: string,
    data: ContributionsModel["editBody"]
  ) {
    const contribution = await db.contribution.findUnique({ where: { id } });
    if (!contribution) throw status(404, { message: "Contribution not found" });
    if (contribution.contributorId !== requesterId)
      throw status(403, { message: "Forbidden" });
    return db.contribution.update({ where: { id }, data });
  }

  static async remove(id: string, requesterId: string) {
    const contribution = await db.contribution.findUnique({
      where: { id },
      include: { memory: { select: { userId: true } } }
    });
    if (!contribution) throw status(404, { message: "Contribution not found" });
    const isOwner = contribution.memory.userId === requesterId;
    const isContributor = contribution.contributorId === requesterId;
    if (!isOwner && !isContributor) throw status(403, { message: "Forbidden" });
    await db.contribution.delete({ where: { id } });
    return status(204);
  }
}
