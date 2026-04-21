import { status } from "elysia";
import { db } from "../../db";
import type { AdminModel } from "./model";

const USER_OMIT = {
  passwordHash: true,
  mfaSecret: true,
  mfaPendingSecret: true
} as const;

export abstract class AdminService {
  static async getStats() {
    const [userCount, memoryCount, sessionCount] = await Promise.all([
      db.user.count(),
      db.memory.count(),
      db.session.count()
    ]);
    return { userCount, memoryCount, sessionCount };
  }

  static async listUsers(page: number, limit: number) {
    const [items, total] = await Promise.all([
      db.user.findMany({
        omit: USER_OMIT,
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
    await db.user.delete({ where: { id } });
    return status(204);
  }

  static async updateUser(id: string, data: AdminModel["updateUserBody"]) {
    const user = await db.user.findUnique({ where: { id } });
    if (!user) throw status(404, { message: "User not found" });
    return db.user.update({ where: { id }, data, omit: USER_OMIT });
  }
}
