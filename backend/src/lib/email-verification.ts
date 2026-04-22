import { createHash, randomInt } from "crypto";
import { status } from "elysia";
import { db } from "../db";
import { isMailConfigured } from "./mailer";

const EMAIL_VERIFICATION_CODE_TTL_MS = 15 * 60 * 1000;
const EMAIL_VERIFICATION_RESEND_COOLDOWN_MS = 30 * 1000;

function hashCode(userId: string, code: string) {
  return createHash("sha256").update(`${userId}:${code}`).digest("hex");
}

function generateCode() {
  return String(randomInt(0, 1_000_000)).padStart(6, "0");
}

export async function issueEmailVerification(userId: string, email: string) {
  if (!isMailConfigured()) {
    await db.user.update({
      where: { id: userId },
      data: {
        emailVerifiedAt: new Date(),
        emailVerificationCodeHash: null,
        emailVerificationExpiresAt: null,
        emailVerificationSentAt: null
      }
    });

    return { message: "Email verification is disabled" } as const;
  }

  const current = await db.user.findUniqueOrThrow({
    where: { id: userId },
    select: {
      emailVerifiedAt: true,
      emailVerificationSentAt: true
    }
  });

  if (current.emailVerifiedAt) {
    return { message: "Email already verified" } as const;
  }

  if (
    current.emailVerificationSentAt &&
    Date.now() - current.emailVerificationSentAt.getTime() <
      EMAIL_VERIFICATION_RESEND_COOLDOWN_MS
  ) {
    throw status(429, {
      message: "Please wait a moment before requesting another code"
    });
  }

  const code = generateCode();
  const expiresAt = new Date(Date.now() + EMAIL_VERIFICATION_CODE_TTL_MS);

  await db.user.update({
    where: { id: userId },
    data: {
      emailVerificationCodeHash: hashCode(userId, code),
      emailVerificationExpiresAt: expiresAt,
      emailVerificationSentAt: new Date()
    }
  });

  console.info("Email verification code generated", { userId, email, code });

  return { message: "Verification code sent" } as const;
}

export async function verifyEmailCode(userId: string, code: string) {
  if (!isMailConfigured()) {
    await db.user.update({
      where: { id: userId },
      data: {
        emailVerifiedAt: new Date(),
        emailVerificationCodeHash: null,
        emailVerificationExpiresAt: null,
        emailVerificationSentAt: null
      }
    });
    return;
  }

  const user = await db.user.findUniqueOrThrow({
    where: { id: userId },
    select: {
      emailVerificationCodeHash: true,
      emailVerificationExpiresAt: true,
      emailVerifiedAt: true
    }
  });

  if (user.emailVerifiedAt) {
    return;
  }

  if (!user.emailVerificationCodeHash || !user.emailVerificationExpiresAt) {
    throw status(400, { message: "No verification code is currently active" });
  }

  if (user.emailVerificationExpiresAt.getTime() < Date.now()) {
    throw status(410, { message: "Verification code expired" });
  }

  if (user.emailVerificationCodeHash !== hashCode(userId, code)) {
    throw status(422, { message: "Invalid verification code" });
  }

  await db.user.update({
    where: { id: userId },
    data: {
      emailVerifiedAt: new Date(),
      emailVerificationCodeHash: null,
      emailVerificationExpiresAt: null,
      emailVerificationSentAt: null
    }
  });
}
