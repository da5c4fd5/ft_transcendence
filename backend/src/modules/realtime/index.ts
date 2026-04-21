import { Elysia, t } from "elysia";
import jwt from "jsonwebtoken";
import { db } from "../../db";
import {
  attachRealtimeConnection,
  detachRealtimeConnection,
  markRealtimeConnectionAlive,
  sendFriendPing
} from "../../lib/realtime";

type SessionPayload = {
  sub?: string;
  jti?: string;
  iat?: number;
  exp?: number;
};

type RealtimeWsData = {
  query: { token?: string };
  userId?: string;
};

async function authenticateRealtimeToken(token?: string) {
  if (!token || !process.env.JWT_SECRET) return null;

  let payload: SessionPayload;
  try {
    payload = jwt.verify(token, process.env.JWT_SECRET) as SessionPayload;
  } catch {
    return null;
  }

  if (!payload.sub || !payload.jti) return null;

  const session = await db.session.findUnique({
    where: { id: payload.jti },
    select: { id: true, userId: true }
  });
  if (!session || session.userId !== payload.sub) return null;

  const user = await db.user.findUnique({
    where: { id: payload.sub },
    select: { id: true }
  });
  return user;
}

export const realtime = new Elysia()
  .ws("/realtime", {
    detail: { hide: true },
    query: t.Object({
      token: t.Optional(t.String())
    }),
    body: t.Object({
      type: t.Union([t.Literal("ping"), t.Literal("heartbeat"), t.Literal("disconnecting")]),
      userId: t.Optional(t.String())
    }),
    async open(ws) {
      const data = ws.data as RealtimeWsData;
      const user = await authenticateRealtimeToken(data.query.token);
      if (!user) {
        ws.close(1008, "Unauthorized");
        return;
      }

      data.userId = user.id;
      await attachRealtimeConnection(user.id, ws);
    },
    async message(ws, message) {
      const data = ws.data as RealtimeWsData;
      if (!data.userId) {
        ws.close(1008, "Unauthorized");
        return;
      }

      markRealtimeConnectionAlive(data.userId, ws);

      if (message.type === "heartbeat") {
        return;
      }

      if (message.type === "disconnecting") {
        await detachRealtimeConnection(data.userId, ws);
        ws.close(1000, "Disconnecting");
        return;
      }

      if (message.type === "ping" && message.userId) {
        const delivered = await sendFriendPing(data.userId, message.userId);
        ws.send(JSON.stringify({
          type: "ping_result",
          userId: message.userId,
          delivered
        }));
      }
    },
    async close(ws) {
      const data = ws.data as RealtimeWsData;
      if (!data.userId) return;
      await detachRealtimeConnection(data.userId, ws);
    }
  });
