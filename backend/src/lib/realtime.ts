import { db } from "../db";

type RealtimeSocket = {
  id: string;
  send(data: string): unknown;
};

type RealtimeEvent =
  | { type: "presence_snapshot"; userIds: string[] }
  | { type: "presence"; userId: string; online: boolean }
  | { type: "ping"; fromUserId: string; fromUsername: string }
  | { type: "ping_result"; userId: string; delivered: boolean }
  | {
      type: "chat_message";
      message: {
        id: string;
        senderId: string;
        recipientId: string;
        content: string;
        createdAt: string;
      };
    };

type ConnectionState = {
  socket: RealtimeSocket;
  lastSeenAt: number;
};

const HEARTBEAT_TIMEOUT_MS = 15_000;
const socketsByUserId = new Map<string, Map<string, ConnectionState>>();

function serialize(event: RealtimeEvent) {
  return JSON.stringify(event);
}

function getSocketSet(userId: string) {
  let sockets = socketsByUserId.get(userId);
  if (!sockets) {
    sockets = new Map();
    socketsByUserId.set(userId, sockets);
  }
  return sockets;
}

async function listAcceptedFriendIds(userId: string) {
  const friendships = await db.friend.findMany({
    where: {
      status: "ACCEPTED",
      OR: [{ requesterId: userId }, { recipientId: userId }]
    },
    select: { requesterId: true, recipientId: true }
  });

  return Array.from(
    new Set(
      friendships.map((friendship) =>
        friendship.requesterId === userId
          ? friendship.recipientId
          : friendship.requesterId
      )
    )
  );
}

function sendToUser(userId: string, event: RealtimeEvent) {
  const sockets = socketsByUserId.get(userId);
  if (!sockets?.size) return 0;

  const payload = serialize(event);
  let sentCount = 0;

  for (const { socket } of sockets.values()) {
    try {
      socket.send(payload);
      sentCount++;
    } catch {
      // Ignore stale sockets. The close hook will eventually prune them.
    }
  }

  return sentCount;
}

async function broadcastPresence(userId: string, online: boolean, friendIds?: string[]) {
  const acceptedFriendIds = friendIds ?? await listAcceptedFriendIds(userId);
  for (const friendId of acceptedFriendIds) {
    sendToUser(friendId, { type: "presence", userId, online });
  }
}

export function isUserOnline(userId: string) {
  return (socketsByUserId.get(userId)?.size ?? 0) > 0;
}

export async function attachRealtimeConnection(userId: string, socket: RealtimeSocket) {
  const sockets = getSocketSet(userId);
  const wasOffline = sockets.size === 0;
  sockets.set(socket.id, { socket, lastSeenAt: Date.now() });

  const friendIds = await listAcceptedFriendIds(userId);
  socket.send(
    serialize({
      type: "presence_snapshot",
      userIds: friendIds.filter(isUserOnline)
    })
  );

  if (wasOffline) {
    await broadcastPresence(userId, true, friendIds);
  }
}

export async function detachRealtimeConnection(userId: string, socket: RealtimeSocket) {
  const sockets = socketsByUserId.get(userId);
  if (!sockets) return;

  sockets.delete(socket.id);
  if (sockets.size > 0) return;

  socketsByUserId.delete(userId);
  await broadcastPresence(userId, false);
}

export function markRealtimeConnectionAlive(userId: string, socket: RealtimeSocket) {
  const sockets = socketsByUserId.get(userId);
  const state = sockets?.get(socket.id);
  if (!state) return false;
  state.lastSeenAt = Date.now();
  return true;
}

export async function sendFriendPing(fromUserId: string, toUserId: string) {
  const friendship = await db.friend.findFirst({
    where: {
      status: "ACCEPTED",
      OR: [
        { requesterId: fromUserId, recipientId: toUserId },
        { requesterId: toUserId, recipientId: fromUserId }
      ]
    },
    select: { id: true }
  });

  if (!friendship) return false;

  const sender = await db.user.findUnique({
    where: { id: fromUserId },
    select: { username: true }
  });
  if (!sender) return false;

  if (!isUserOnline(toUserId)) return false;

  return (
    sendToUser(toUserId, {
      type: "ping",
      fromUserId,
      fromUsername: sender.username
    }) > 0
  );
}

export function broadcastChatMessage(message: {
  id: string;
  senderId: string;
  recipientId: string;
  content: string;
  createdAt: string;
}) {
  const event: RealtimeEvent = {
    type: "chat_message",
    message
  };

  sendToUser(message.senderId, event);
  if (message.recipientId !== message.senderId) {
    sendToUser(message.recipientId, event);
  }
}

setInterval(async () => {
  const now = Date.now();
  const toDetach: Array<{ userId: string; socket: RealtimeSocket }> = [];

  for (const [userId, sockets] of socketsByUserId) {
    for (const { socket, lastSeenAt } of sockets.values()) {
      if (now - lastSeenAt > HEARTBEAT_TIMEOUT_MS) {
        toDetach.push({ userId, socket });
      }
    }
  }

  await Promise.all(
    toDetach.map(({ userId, socket }) => detachRealtimeConnection(userId, socket))
  );
}, 5_000);
