import { status } from "elysia";
import { db } from "../../db";
import { broadcastChatMessage } from "../../lib/realtime";
import type { ChatModel } from "./model";

function toChatMessage(message: {
  id: string;
  senderId: string;
  recipientId: string;
  content: string;
  createdAt: Date;
  readAt: Date | null;
}) {
  return {
    id: message.id,
    senderId: message.senderId,
    recipientId: message.recipientId,
    content: message.content,
    createdAt: message.createdAt.toISOString(),
    readAt: message.readAt?.toISOString() ?? null
  };
}

async function assertAcceptedFriendship(userId: string, friendId: string) {
  if (userId === friendId) {
    throw status(400, { message: "You cannot chat with yourself" });
  }

  const friendship = await db.friend.findFirst({
    where: {
      status: "ACCEPTED",
      OR: [
        { requesterId: userId, recipientId: friendId },
        { requesterId: friendId, recipientId: userId }
      ]
    },
    select: { id: true }
  });

  if (!friendship) {
    throw status(403, { message: "You can only chat with accepted friends" });
  }
}

export abstract class ChatService {
  static async listMessages(
    userId: string,
    friendId: string,
    query: ChatModel["messagesQuery"]
  ) {
    await assertAcceptedFriendship(userId, friendId);

    const where = {
      OR: [
        { senderId: userId, recipientId: friendId },
        { senderId: friendId, recipientId: userId }
      ],
      ...(query.before
        ? { createdAt: { lt: new Date(query.before) } }
        : {})
    };

    const limit = query.limit ?? 50;
    const messages = await db.chatMessage.findMany({
      where,
      orderBy: { createdAt: "desc" },
      take: limit
    });

    await db.chatMessage.updateMany({
      where: {
        senderId: friendId,
        recipientId: userId,
        readAt: null
      },
      data: {
        readAt: new Date()
      }
    });

    return messages.reverse().map(toChatMessage);
  }

  static async sendMessage(
    userId: string,
    friendId: string,
    body: ChatModel["sendMessageBody"]
  ) {
    await assertAcceptedFriendship(userId, friendId);
    const content = body.content.trim();
    if (!content) {
      throw status(422, { message: "Message content cannot be empty" });
    }

    const message = await db.chatMessage.create({
      data: {
        senderId: userId,
        recipientId: friendId,
        content
      }
    });

    const normalized = toChatMessage(message);
    broadcastChatMessage(normalized);
    return normalized;
  }
}
