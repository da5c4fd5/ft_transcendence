import { Elysia } from "elysia";
import { jwtPlugin } from "./jwt.plugin";
import { db } from "../db";
import type { AuthModel } from "../modules/auth/model";

export const authPlugin = new Elysia({ name: "auth-plugin" })
  .use(jwtPlugin)
  .derive({ as: "global" }, async ({ headers, cookie, jwt }) => {
    const cookieVal = cookie.session?.value;
    const token: string | undefined =
      (typeof cookieVal === "string" ? cookieVal : undefined) ??
      headers.authorization?.replace("Bearer ", "");

    if (!token) return { user: null };

    let payload: { sub: string; jti: string; iat?: number; exp?: number };
    try {
      payload = (await jwt.verify(token)) as typeof payload;
    } catch {
      return { user: null };
    }

    if (!payload.sub || !payload.jti) return { user: null };

    const session = await db.session.findUnique({ where: { id: payload.jti } });
    if (!session) return { user: null };

    const userRecord = await db.user.findUnique({ where: { id: payload.sub } });
    if (!userRecord) return { user: null };

    return {
      user: {
        id: userRecord.id,
        email: userRecord.email,
        isAdmin: userRecord.isAdmin,
        sessionId: session.id
      } satisfies AuthModel["userPayload"]
    };
  });
