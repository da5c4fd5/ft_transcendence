import { status } from "elysia";
import { mkdirSync } from "node:fs";
import { join } from "node:path";
import { PrismaClientKnownRequestError } from "@prisma/client/runtime/client";
import { db } from "../../db";
import type { UsersModel } from "./model";
import { encryptSecret, decryptSecret } from "../../lib/mfa-crypto";
import {
  issueEmailVerification,
  verifyEmailCode
} from "../../lib/email-verification";
import { buildUserDataExport } from "../../lib/data-export";
import { isMailConfigured, sendMail } from "../../lib/mailer";
import { assertImageFileSize } from "../../lib/images";
import {
  createPublicApiKey,
  revokePublicApiKey as revokeStoredPublicApiKey
} from "../../lib/public-api";
import { TOTP, NobleCryptoPlugin, ScureBase32Plugin } from "otplib";
import QRCode from "qrcode";
import { MemoriesService } from "../memories/service";

const AVATARS_DIR = join(import.meta.dir, "../../../public/avatars");
const DELETE_ACCOUNT_CONFIRMATION = "delete my account";
const TREE_STAGES = [
  { min: 88, stage: 8, label: "Paradise Tree" },
  { min: 76, stage: 7, label: "Blooming Tree" },
  { min: 63, stage: 6, label: "Flourishing Tree" },
  { min: 51, stage: 5, label: "Strong Sapling" },
  { min: 38, stage: 4, label: "Young Plant" },
  { min: 26, stage: 3, label: "Fragile Sprout" },
  { min: 13, stage: 2, label: "New Seedling" },
  { min: 0, stage: 1, label: "Dormant Seed" }
] as const;

const SELF_USER_SELECT = {
  id: true,
  username: true,
  email: true,
  emailVerifiedAt: true,
  displayName: true,
  avatarUrl: true,
  notificationSettings: true,
  publicApiKeyPreview: true,
  publicApiKeyCreatedAt: true,
  isAdmin: true,
  mfaSecret: true
} as const;

const PUBLIC_USER_SELECT = {
  id: true,
  username: true,
  displayName: true,
  avatarUrl: true
} as const;

const SEARCH_USER_SELECT = {
  id: true,
  username: true,
  avatarUrl: true
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

type SelfUserRecord = {
  id: string;
  username: string;
  email: string;
  emailVerifiedAt: Date | null;
  displayName: string | null;
  avatarUrl: string | null;
  notificationSettings: unknown;
  publicApiKeyPreview: string | null;
  publicApiKeyCreatedAt: Date | null;
  isAdmin: boolean;
  mfaSecret: string | null;
};

function extensionForMime(mimeType: string) {
  const subtype = mimeType.split("/")[1] ?? "bin";
  return subtype.replace("jpeg", "jpg").replace(/[^a-z0-9]/gi, "") || "bin";
}

function getLocalDayStart(reference = new Date()) {
  const start = new Date(reference);
  start.setHours(0, 0, 0, 0);
  return start;
}

function getDaysSinceLocalDate(date: Date) {
  const diffMs =
    getLocalDayStart().getTime() - getLocalDayStart(date).getTime();
  return Math.max(0, Math.round(diffMs / (24 * 60 * 60 * 1000)));
}

export abstract class UsersService {
  private static rethrowUniqueConstraint(error: unknown) {
    if (
      error instanceof PrismaClientKnownRequestError &&
      error.code === "P2002"
    ) {
      throw status(409, { message: "That value is already in use" });
    }
    throw error;
  }

  private static normalizeNotificationSettings(value: unknown) {
    return value && typeof value === "object" && !Array.isArray(value) ? value : {};
  }

  private static toSelfProfile(user: SelfUserRecord) {
    const {
      mfaSecret,
      notificationSettings,
      emailVerifiedAt,
      publicApiKeyPreview,
      publicApiKeyCreatedAt,
      ...rest
    } = user;
    return {
      ...rest,
      emailVerified: !!emailVerifiedAt || !isMailConfigured(),
      notificationSettings: UsersService.normalizeNotificationSettings(notificationSettings),
      publicApi: {
        enabled: !!publicApiKeyPreview,
        preview: publicApiKeyPreview,
        createdAt: publicApiKeyCreatedAt?.toISOString() ?? null
      },
      hasMfa: !!mfaSecret
    };
  }

  static async findSelfById(id: string) {
    const user = await db.user.findUniqueOrThrow({
      where: { id },
      select: SELF_USER_SELECT
    });
    return UsersService.toSelfProfile(user);
  }

  static async findPublicById(id: string) {
    return db.user.findUniqueOrThrow({
      where: { id },
      select: PUBLIC_USER_SELECT
    });
  }

  static async findByUsername(username: string) {
    return db.user.findMany({
      where: { username: { startsWith: username } },
      select: SEARCH_USER_SELECT,
      take: 10
    });
  }

  static async updateProfile(
    id: string,
    data: UsersModel["updateProfileBody"]
  ) {
    let user: SelfUserRecord;
    try {
      user = await db.user.update({
        where: { id },
        data,
        select: SELF_USER_SELECT
      });
    } catch (error) {
      UsersService.rethrowUniqueConstraint(error);
    }
    return UsersService.toSelfProfile(user);
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
    if (data.email === user.email) {
      return UsersService.findSelfById(id);
    }
    if (!(await Bun.password.verify(data.password, user.passwordHash)))
      throw status(422, { message: "Password is incorrect" });
    let updatedUser: SelfUserRecord;
    try {
      updatedUser = await db.user.update({
        where: { id },
        data: {
          email: data.email,
          emailVerifiedAt: null,
          emailVerificationCodeHash: null,
          emailVerificationExpiresAt: null,
          emailVerificationSentAt: null
        },
        select: SELF_USER_SELECT
      });
    } catch (error) {
      UsersService.rethrowUniqueConstraint(error);
    }
    try {
      await issueEmailVerification(id, updatedUser.email);
    } catch (error) {
      console.error("Failed to send email verification after email change", {
        userId: id,
        error
      });
    }
    return UsersService.toSelfProfile(updatedUser);
  }

  static async deleteSelf(
    id: string,
    data: UsersModel["deleteAccountBody"]
  ) {
    const user = await db.user.findUniqueOrThrow({ where: { id } });

    if (!(await Bun.password.verify(data.password, user.passwordHash))) {
      throw status(401, {
        error: "Password is incorrect"
      } satisfies UsersModel["deleteAccountInvalidPassword"]);
    }

    if (data.confirmation.trim() !== DELETE_ACCOUNT_CONFIRMATION) {
      throw status(400, {
        error: "Confirmation phrase does not match"
      } satisfies UsersModel["deleteAccountInvalidConfirmation"]);
    }

    if (user.isAdmin) {
      const adminCount = await db.user.count({ where: { isAdmin: true } });
      if (adminCount <= 1) {
        throw status(400, {
          error: "At least one admin must remain"
        });
      }
    }

    if (isMailConfigured()) {
      await sendMail({
        to: user.email,
        subject: "Your Capsul account was deleted",
        text:
          `Hello ${user.username},\n\n` +
          `This is a confirmation that your Capsul account and related data were deleted on ${new Date().toISOString()}.\n`
      });
    }

    await db.user.delete({ where: { id } });
    return status(204);
  }

  static async exportSelf(id: string) {
    const user = await db.user.findUniqueOrThrow({
      where: { id },
      select: {
        email: true,
        username: true
      }
    });

    const payload = await buildUserDataExport(id);
    if (isMailConfigured()) {
      await sendMail({
        to: user.email,
        subject: "Your Capsul data export",
        text:
          `Hello ${user.username},\n\n` +
          `This is a confirmation that a readable export of your Capsul data was requested on ${new Date().toISOString()}.\n`
      });
    }

    const filename = `capsul-data-export-${new Date().toISOString().slice(0, 10)}.json`;
    return new Response(JSON.stringify(payload, null, 2), {
      headers: {
        "Content-Type": "application/json; charset=utf-8",
        "Content-Disposition": `attachment; filename="${filename}"`
      }
    });
  }

  static async uploadAvatar(id: string, file: File) {
    assertImageFileSize(file);
    const ext = extensionForMime(file.type);
    const filename = `${crypto.randomUUID()}.${ext}`;
    mkdirSync(AVATARS_DIR, { recursive: true });
    await Bun.write(join(AVATARS_DIR, filename), file);
    const updatedUser = await db.user.update({
      where: { id },
      data: { avatarUrl: `/avatars/${filename}` },
      select: SELF_USER_SELECT
    });
    return UsersService.toSelfProfile(updatedUser);
  }

  static async updateNotificationSettings(
    id: string,
    settings: UsersModel["notificationSettingsBody"]
  ) {
    const updatedUser = await db.user.update({
      where: { id },
      data: { notificationSettings: settings },
      select: SELF_USER_SELECT
    });
    return UsersService.toSelfProfile(updatedUser);
  }

  static async getTree(id: string) {
    const [stats, latestMemory] = await Promise.all([
      MemoriesService.getStats(id),
      db.memory.findFirst({
        where: { userId: id },
        orderBy: { date: "desc" },
        select: { date: true }
      })
    ]);

    if (!latestMemory) {
      return {
        lifeForce: 0,
        isDecreasing: false,
        stage: 1,
        stageLabel: "Dormant Seed",
        lastMemoryDate: null
      } satisfies UsersModel["treeResponse"];
    }

    const daysSinceLastMemory = getDaysSinceLocalDate(latestMemory.date);
    const recentScore = Math.max(0, 45 - daysSinceLastMemory * 12);
    const streakScore = Math.min(25, stats.dayStreak * 5);
    const memoryScore = Math.min(20, stats.totalCapsuls * 1.5);
    const wordsScore = Math.min(10, stats.wordsWritten / 200);
    const lifeForce = Math.max(
      0,
      Math.min(
        100,
        Math.round(recentScore + streakScore + memoryScore + wordsScore)
      )
    );
    const stage =
      TREE_STAGES.find((item) => lifeForce >= item.min) ??
      TREE_STAGES[TREE_STAGES.length - 1];

    return {
      lifeForce,
      isDecreasing: daysSinceLastMemory >= 1,
      stage: stage.stage,
      stageLabel: stage.label,
      lastMemoryDate: latestMemory.date.toISOString().split("T")[0]
    } satisfies UsersModel["treeResponse"];
  }

  static async requestEmailVerification(id: string) {
    const user = await db.user.findUniqueOrThrow({
      where: { id },
      select: { email: true }
    });
    return issueEmailVerification(id, user.email);
  }

  static async confirmEmailVerification(
    id: string,
    data: UsersModel["emailVerificationBody"]
  ) {
    await verifyEmailCode(id, data.code.trim());
    return UsersService.findSelfById(id);
  }

  static async getPublicApiKey(id: string) {
    const user = await db.user.findUniqueOrThrow({
      where: { id },
      select: {
        publicApiKeyPreview: true,
        publicApiKeyCreatedAt: true
      }
    });

    return {
      enabled: !!user.publicApiKeyPreview,
      preview: user.publicApiKeyPreview,
      createdAt: user.publicApiKeyCreatedAt?.toISOString() ?? null
    };
  }

  static issuePublicApiKey(id: string) {
    return createPublicApiKey(id);
  }

  static async revokePublicApiKey(id: string) {
    await revokeStoredPublicApiKey(id);
    return status(204);
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
