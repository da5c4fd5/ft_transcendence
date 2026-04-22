import { status } from "elysia";
import { db } from "../../db";
import type { AuthModel } from "./model";
import { PrismaClientKnownRequestError } from "@prisma/client/runtime/client";
import { signPreAuthToken, verifyPreAuthToken } from "../../lib/pre-auth";
import { decryptSecret } from "../../lib/mfa-crypto";
import { issueEmailVerification } from "../../lib/email-verification";
import { TOTP, NobleCryptoPlugin, ScureBase32Plugin } from "otplib";

const totp = new TOTP({
  crypto: new NobleCryptoPlugin(),
  base32: new ScureBase32Plugin()
});

type TokenSigner = (payload: { sub: string; jti: string }) => Promise<string>;

export abstract class Auth {
  static async logIn(
    { email, password }: AuthModel["logInBody"],
    signToken: TokenSigner,
    userAgent?: string
  ) {
    const DUMMY_HASH =
      "$argon2id$v=19$m=65536,t=2,p=1$JgB5ZgIdHXxaGkpjo1AtlSUMzI921hJg1R9fczMtElU$l0S6Tmhcddlt2/q/UUV6B2inpLhld7ukux6SdepG7rg";

    const user = await db.user.findUnique({ where: { email } });
    const hash = user?.passwordHash ?? DUMMY_HASH;
    const isValid = await Bun.password.verify(password, hash);

    if (!user || !isValid)
      throw status("Unauthorized", {
        error: "Invalid email or password"
      } satisfies AuthModel["logInInvalid"]);

    if (user.mfaSecret) {
      const mfaToken = signPreAuthToken(user.id);
      return {
        mfaRequired: true as const,
        mfaToken
      } satisfies AuthModel["logInMfaRequired"];
    }

    const session = await db.session.create({
      data: { userId: user.id, userAgent: userAgent ?? null }
    });
    const token = await signToken({ sub: user.id, jti: session.id });
    return { token } satisfies AuthModel["logInResponse"];
  }

  static async verifyMfaLogin(
    { mfaToken, code }: AuthModel["mfaLoginBody"],
    signToken: TokenSigner,
    userAgent?: string
  ) {
    let userId: string;
    try {
      userId = verifyPreAuthToken(mfaToken);
    } catch {
      throw status(401, {
        error: "Invalid or expired MFA code"
      } satisfies AuthModel["mfaLoginInvalid"]);
    }

    const user = await db.user.findUnique({ where: { id: userId } });
    if (!user?.mfaSecret)
      throw status(401, {
        error: "Invalid or expired MFA code"
      } satisfies AuthModel["mfaLoginInvalid"]);

    const secret = decryptSecret(user.mfaSecret);
    const result = await totp.verify(code, { secret });
    if (!result.valid)
      throw status(401, {
        error: "Invalid or expired MFA code"
      } satisfies AuthModel["mfaLoginInvalid"]);

    const session = await db.session.create({
      data: { userId: user.id, userAgent: userAgent ?? null }
    });
    const token = await signToken({ sub: user.id, jti: session.id });
    return { token } satisfies AuthModel["logInResponse"];
  }

  static async signUp(
    { email, username, password }: AuthModel["signUpBody"],
    signToken: TokenSigner,
    userAgent?: string
  ) {
    const passwordHash = await Bun.password.hash(password);
    let userId: string;
    try {
      const user = await db.$transaction(async (tx) => {
        // Serialize the "first user becomes admin" decision across concurrent signups.
        await tx.$executeRaw`SELECT pg_advisory_xact_lock(424242)`;

        const isFirstUser = (await tx.user.count()) === 0;
        return tx.user.create({
          data: { email, username, passwordHash, isAdmin: isFirstUser },
          select: { id: true }
        });
      });
      userId = user.id;
    } catch (err) {
      if (err instanceof PrismaClientKnownRequestError && err.code == "P2002")
        throw status("Conflict", {
          error: "Email already registered"
        } satisfies AuthModel["signUpConflict"]);
      console.error(err);
      throw status("Internal Server Error", {});
    }
    await issueEmailVerification(userId, email);
    const session = await db.session.create({
      data: { userId, userAgent: userAgent ?? null }
    });
    const token = await signToken({ sub: userId, jti: session.id });
    return { token } satisfies AuthModel["signUpResponse"];
  }

  static async listSessions(userId: string, currentSessionId: string) {
    const sessions = await db.session.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
    });
    return sessions.map(s => ({
      id: s.id,
      userAgent: s.userAgent ?? 'Unknown device',
      connectedAt: s.createdAt.toISOString(),
      isCurrent: s.id === currentSessionId,
    }));
  }

  static async revokeSession(sessionId: string) {
    await db.session.delete({ where: { id: sessionId } });
    return status(204);
  }

  static async revokeOtherSession(
    sessionId: string,
    userId: string,
    currentSessionId: string
  ) {
    if (sessionId === currentSessionId) {
      throw status(400, {
        message: "Use logout to revoke the current session"
      });
    }
    await db.session.deleteMany({ where: { id: sessionId, userId } });
    return new Response(null, { status: 204 });
  }
}
