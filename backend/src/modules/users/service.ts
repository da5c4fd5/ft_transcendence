import { status } from "elysia";
import { mkdirSync } from "node:fs";
import { join } from "node:path";
import { db } from "../../db";
import type { UsersModel } from "./model";

const AVATARS_DIR = join(import.meta.dir, "../../../public/avatars");

export abstract class UsersService {
  static async findById(id: string) {
    return db.user.findUniqueOrThrow({
      where: { id },
      omit: { passwordHash: true }
    });
  }

  static async updateProfile(
    id: string,
    data: UsersModel["updateProfileBody"]
  ) {
    return db.user.update({
      where: { id },
      data,
      omit: { passwordHash: true }
    });
  }

  static async changePassword(
    id: string,
    data: UsersModel["changePasswordBody"]
  ) {
    const user = await db.user.findUniqueOrThrow({ where: { id } });

    const isValidPassword = await Bun.password.verify(
      data.currentPassword,
      user.passwordHash
    );
    const isSamePassword = await Bun.password.verify(
      data.newPassword,
      user.passwordHash
    );

    if (!isValidPassword)
      throw status(401, {
        error: "Current password is incorrect"
      } satisfies UsersModel["changePasswordInvalid"]);

    if (isSamePassword)
      throw status(400, {
        error: "New password cannot be old password"
      } satisfies UsersModel["changePasswordSame"]);

    const passwordHash = await Bun.password.hash(data.newPassword);

    await db.user.update({ where: { id }, data: { passwordHash } });
    return {
      message: "Password updated"
    } satisfies UsersModel["changePasswordResponse"];
  }

  static async changeEmail(id: string, data: UsersModel["changeEmailBody"]) {
    const user = await db.user.findUniqueOrThrow({ where: { id } });
    if (!(await Bun.password.verify(data.password, user.passwordHash)))
      throw status(422, { message: "Password is incorrect" });
    await db.user.update({ where: { id }, data: { email: data.email } });
    return { message: "Email updated" };
  }

  static async uploadAvatar(id: string, file: File) {
    const ext = file.name.split(".").pop() ?? "bin";
    const filename = `${crypto.randomUUID()}.${ext}`;
    mkdirSync(AVATARS_DIR, { recursive: true });
    await Bun.write(join(AVATARS_DIR, filename), file);
    return db.user.update({
      where: { id },
      data: { avatarUrl: `/avatars/${filename}` },
      omit: { passwordHash: true }
    });
  }

  static async updateNotificationSettings(
    id: string,
    settings: UsersModel["notificationSettingsBody"]
  ) {
    return db.user.update({
      where: { id },
      data: { notificationSettings: settings },
      omit: { passwordHash: true }
    });
  }

  static async getTree(id: string) {
    const { treeState } = await db.user.findUniqueOrThrow({
      where: { id },
      select: { treeState: true }
    });
    return treeState;
  }

  static async updateTree(id: string, data: UsersModel["treeBody"]) {
    const { treeState } = await db.user.update({
      where: { id },
      data: { treeState: data as object },
      select: { treeState: true }
    });
    return treeState;
  }

  static async getStats(userId: string) {
    const memories = await db.memory.findMany({
      where: { userId },
      select: { content: true, date: true, isOpen: true },
      orderBy: { date: "desc" },
    });
    const totalCapsuls = memories.length;
    const shared = memories.filter(m => m.isOpen).length;
    const wordsWritten = memories.reduce(
      (acc, m) => acc + m.content.trim().split(/\s+/).filter(Boolean).length,
      0
    );
    const dateSet = new Set(memories.map(m => m.date.toISOString().split("T")[0]));
    let dayStreak = 0;
    const cur = new Date();
    cur.setHours(0, 0, 0, 0);
    while (dateSet.has(cur.toISOString().split("T")[0])) {
      dayStreak++;
      cur.setDate(cur.getDate() - 1);
    }
    return { totalCapsuls, shared, dayStreak, wordsWritten };
  }

  static async search(query: string, excludeUserId: string) {
    const q = query.trim();
    if (q.length < 2) return [];
    return db.user.findMany({
      where: {
        id: { not: excludeUserId },
        OR: [
          { username:    { contains: q, mode: "insensitive" } },
          { displayName: { contains: q, mode: "insensitive" } },
        ],
      },
      omit: { passwordHash: true },
      take: 10,
    });
  }
}
