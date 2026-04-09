import { status } from "elysia";
import { db } from "../../db";

export abstract class FriendsService {
  static async list(userId: string) {
    return db.friend.findMany({
      where: {
        status: "ACCEPTED",
        OR: [{ requesterId: userId }, { recipientId: userId }]
      },
      include: {
        requester: { omit: { passwordHash: true } },
        recipient: { omit: { passwordHash: true } }
      }
    });
  }

  static async add(userId: string, targetUserId: string) {
    if (userId === targetUserId)
      throw status(400, {
        message: "Cannot send a friend request to yourself"
      });

    // Case A: they already sent us a request → auto-accept
    const incoming = await db.friend.findUnique({
      where: {
        requesterId_recipientId: {
          requesterId: targetUserId,
          recipientId: userId
        }
      }
    });
    if (incoming) {
      if (incoming.status === "ACCEPTED") return { message: "Already friends" };
      return db.friend.update({
        where: { id: incoming.id },
        data: { status: "ACCEPTED" }
      });
    }

    // Case B: we already sent them a request
    const outgoing = await db.friend.findUnique({
      where: {
        requesterId_recipientId: {
          requesterId: userId,
          recipientId: targetUserId
        }
      }
    });
    if (outgoing) {
      if (outgoing.status === "ACCEPTED") return { message: "Already friends" };
      return { message: "Request already sent" };
    }

    // Case C: verify target exists then create
    const target = await db.user.findUnique({
      where: { id: targetUserId },
      select: { id: true }
    });
    if (!target) throw status(404, { message: "User not found" });

    return db.friend.create({
      data: {
        requesterId: userId,
        recipientId: targetUserId,
        status: "PENDING"
      }
    });
  }

  static async remove(userId: string, targetUserId: string) {
    await db.friend.deleteMany({
      where: {
        OR: [
          { requesterId: userId, recipientId: targetUserId },
          { requesterId: targetUserId, recipientId: userId }
        ]
      }
    });
    return { message: "Deleted" };
  }
}
