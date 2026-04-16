import { status } from "elysia";
import { mkdirSync } from "node:fs";
import { join } from "node:path";
import { db } from "../../db";
import type { UsersModel } from "./model";
import { encryptSecret, decryptSecret } from "../../lib/mfa-crypto";
import { TOTP, NobleCryptoPlugin, ScureBase32Plugin } from "otplib";
import QRCode from "qrcode";

const AVATARS_DIR = join(import.meta.dir, "../../../public/avatars");

const USER_OMIT = {
  passwordHash: true,
  mfaSecret: true,
  mfaPendingSecret: true
} as const;

const totp = new TOTP({
  crypto: new NobleCryptoPlugin(),
  base32: new ScureBase32Plugin(),
  issuer: "Transcendence"
});

const ACHIEVEMENTS = [
  { id: "first_memory", check: (s: AchievementStats) => s.memCount >= 1 },
  { id: "week_warrior", check: (s: AchievementStats) => s.distinctDays >= 7 },
  { id: "memory_keeper", check: (s: AchievementStats) => s.memCount >= 30 },
  {
    id: "social_butterfly",
    check: (s: AchievementStats) => s.friendCount >= 5
  },
  { id: "open_book", check: (s: AchievementStats) => s.hasOpen },
  { id: "contributor", check: (s: AchievementStats) => s.contribCount >= 5 }
] as const;

type AchievementStats = {
  memCount: number;
  distinctDays: number;
  friendCount: number;
  hasOpen: boolean;
  contribCount: number;
};

export abstract class UsersService {
  static async findById(id: string) {
    const user = await db.user.findUniqueOrThrow({ where: { id } });
    const { passwordHash, mfaSecret, mfaPendingSecret, ...rest } = user;
    return { ...rest, hasMfa: !!mfaSecret };
  }

  static async findByUsername(username: string) {
    return db.user.findMany({
      where: { username: { startsWith: username } },
      select: { username: true, id: true, avatarUrl: true },
      take: 10
    });
  }

  static async updateProfile(
    id: string,
    data: UsersModel["updateProfileBody"]
  ) {
    return db.user.update({ where: { id }, data, omit: USER_OMIT });
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
    return db.user.update({
      where: { id },
      data: { email: data.email },
      omit: USER_OMIT
    });
  }

  static async uploadAvatar(id: string, file: File) {
    const ext = file.name.split(".").pop() ?? "bin";
    const filename = `${crypto.randomUUID()}.${ext}`;
    mkdirSync(AVATARS_DIR, { recursive: true });
    await Bun.write(join(AVATARS_DIR, filename), file);
    return db.user.update({
      where: { id },
      data: { avatarUrl: `/avatars/${filename}` },
      omit: USER_OMIT
    });
  }

  static async updateNotificationSettings(
    id: string,
    settings: UsersModel["notificationSettingsBody"]
  ) {
    return db.user.update({
      where: { id },
      data: { notificationSettings: settings },
      omit: USER_OMIT
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

  // ── MFA ────────────────────────────────────────────────────────────

  /** Begin MFA setup: generate a new secret and return QR code data. */
  static async setupMfa(userId: string, email: string) {
    const secret = totp.generateSecret();
    const uri = totp.toURI({ label: email, secret });
    const qrCode = await QRCode.toDataURL(uri);

    await db.user.update({
      where: { id: userId },
      data: { mfaPendingSecret: encryptSecret(secret) }
    });

    return { secret, qrCode } satisfies UsersModel["mfaSetupResponse"];
  }

  /** Confirm setup: verify code against pending secret, promote it to active. */
  static async verifyMfaSetup(
    userId: string,
    { code }: UsersModel["mfaVerifyBody"]
  ) {
    const user = await db.user.findUniqueOrThrow({ where: { id: userId } });

    if (!user.mfaPendingSecret)
      throw status(400, { message: "No MFA setup in progress" });

    const secret = decryptSecret(user.mfaPendingSecret);
    const result = await totp.verify(code, { secret });
    if (!result.valid)
      throw status(422, { message: "Invalid TOTP code" });

    await db.user.update({
      where: { id: userId },
      data: { mfaSecret: user.mfaPendingSecret, mfaPendingSecret: null }
    });

    return status(204);
  }

  /** Disable MFA: require both current password and a valid TOTP code. */
  static async disableMfa(
    userId: string,
    { password, code }: UsersModel["mfaDisableBody"]
  ) {
    const user = await db.user.findUniqueOrThrow({ where: { id: userId } });

    if (!user.mfaSecret)
      throw status(400, { message: "MFA is not enabled" });

    if (!(await Bun.password.verify(password, user.passwordHash)))
      throw status(401, { message: "Password is incorrect" });

    const secret = decryptSecret(user.mfaSecret);
    const result = await totp.verify(code, { secret });
    if (!result.valid)
      throw status(422, { message: "Invalid TOTP code" });

    await db.user.update({
      where: { id: userId },
      data: { mfaSecret: null, mfaPendingSecret: null }
    });

    return status(204);
  }

  // ── Achievements ───────────────────────────────────────────────────

  /** Return the IDs of achievements the user has unlocked. */
  static async getAchievements(userId: string): Promise<string[]> {
    const [memCount, contribCount, friendCount, distinctDaysRows, hasOpen] =
      await Promise.all([
        db.memory.count({ where: { userId } }),
        db.contribution.count({ where: { contributorId: userId } }),
        db.friend.count({
          where: {
            OR: [{ requesterId: userId }, { recipientId: userId }],
            status: "ACCEPTED"
          }
        }),
        db.memory.findMany({
          where: { userId },
          select: { date: true },
          distinct: ["date"]
        }),
        db.memory.findFirst({ where: { userId, isOpen: true } })
      ]);

    const stats: AchievementStats = {
      memCount,
      contribCount,
      friendCount,
      distinctDays: distinctDaysRows.length,
      hasOpen: hasOpen !== null
    };

    return ACHIEVEMENTS.filter((a) => a.check(stats)).map((a) => a.id);
  }
}
