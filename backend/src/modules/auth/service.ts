import { status } from "elysia";
import { db } from "../../db";
import type { AuthModel } from "./model";
import { PrismaClientKnownRequestError } from "@prisma/client/runtime/client";

type TokenSigner = (payload: { sub: string; jti: string }) => Promise<string>;

export abstract class Auth {
  static async logIn(
    { email, password }: AuthModel["logInBody"],
    signToken: TokenSigner,
    userAgent?: string
  ) {
    const DUMMY_HASH =
      "$argon2id$v=19$m=65536,t=2,p=1$JgB5ZgIdHXxaGkpjo1AtlSUMzI921hJg1R9fczMtElU$l0S6Tmhcddlt2/q/UUV6B2inpLhld7ukux6SdepG7rg";

    const user = await db.user.findUnique({ where: { email: email } });
    const hash = user?.passwordHash ?? DUMMY_HASH;
    const isValid = await Bun.password.verify(password, hash);

    if (!user || !isValid)
      throw status("Unauthorized", {
        error: "Invalid email or password"
      } satisfies AuthModel["logInInvalid"]);

    const session = await db.session.create({ data: { userId: user.id, userAgent: userAgent ?? null } });
    const token = await signToken({ sub: user.id, jti: session.id });
    return { token } satisfies AuthModel["logInResponse"];
  }

  static async signUp(
    { email, username, password }: AuthModel["signUpBody"],
    signToken: TokenSigner,
    userAgent?: string
  ) {
    const passwordHash = await Bun.password.hash(password);
    try {
      await db.user.create({
        data: { email, username, passwordHash },
        omit: { passwordHash: true }
      });
    } catch (err) {
      if (err instanceof PrismaClientKnownRequestError && err.code == "P2002")
        throw status("Conflict", {
          error: "Email already registered"
        } satisfies AuthModel["signUpConflict"]);
      console.error(err);
      throw status("Internal Server Error", {});
    }
    return await this.logIn({ email, password }, signToken, userAgent);
  }

  static async listSessions(userId: string, currentSessionId: string) {
    const sessions = await db.session.findMany({ where: { userId } });
    return sessions
      .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime())
      .map(s => ({
        id:          s.id,
        userAgent:   s.userAgent ?? 'Unknown',
        connectedAt: s.createdAt.toISOString(),
        isCurrent:   s.id === currentSessionId,
      }));
  }

  static async revokeSession(sessionId: string) {
    await db.session.delete({ where: { id: sessionId } });
    return {
      message: "Logged out"
    } satisfies AuthModel["revokeSessionResponse"];
  }
}
