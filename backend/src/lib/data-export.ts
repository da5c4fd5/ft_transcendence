import { db } from "../db";

export async function buildUserDataExport(userId: string) {
  const [user, friends, sessions, memories, chatMessages, promptSuggestions, moodJobs] =
    await Promise.all([
      db.user.findUniqueOrThrow({
        where: { id: userId },
        select: {
          id: true,
          email: true,
          emailVerifiedAt: true,
          username: true,
          displayName: true,
          avatarUrl: true,
          notificationSettings: true,
          isAdmin: true,
          publicApiKeyPreview: true,
          publicApiKeyCreatedAt: true,
          createdAt: true,
          updatedAt: true
        }
      }),
      db.friend.findMany({
        where: {
          OR: [{ requesterId: userId }, { recipientId: userId }]
        },
        orderBy: { createdAt: "asc" },
        select: {
          id: true,
          status: true,
          createdAt: true,
          requester: {
            select: {
              id: true,
              username: true,
              avatarUrl: true
            }
          },
          recipient: {
            select: {
              id: true,
              username: true,
              avatarUrl: true
            }
          }
        }
      }),
      db.session.findMany({
        where: { userId },
        orderBy: { createdAt: "desc" },
        select: {
          id: true,
          userAgent: true,
          createdAt: true
        }
      }),
      db.memory.findMany({
        where: { userId },
        orderBy: { date: "asc" },
        include: {
          media: {
            orderBy: { createdAt: "asc" }
          },
          contributions: {
            orderBy: { createdAt: "asc" },
            include: {
              contributor: {
                select: {
                  id: true,
                  username: true,
                  avatarUrl: true
                }
              }
            }
          }
        }
      }),
      db.chatMessage.findMany({
        where: {
          OR: [{ senderId: userId }, { recipientId: userId }]
        },
        orderBy: { createdAt: "asc" },
        select: {
          id: true,
          senderId: true,
          recipientId: true,
          content: true,
          createdAt: true,
          readAt: true
        }
      }),
      db.promptSuggestion.findMany({
        where: { userId },
        orderBy: { position: "asc" },
        select: {
          id: true,
          prompt: true,
          position: true,
          createdAt: true
        }
      }),
      db.moodClassificationJob.findMany({
        where: { userId },
        orderBy: { createdAt: "desc" },
        select: {
          id: true,
          memoryId: true,
          status: true,
          rawLabel: true,
          rawScore: true,
          mood: true,
          createdAt: true,
          updatedAt: true
        }
      })
    ]);

  return {
    exportedAt: new Date().toISOString(),
    profile: {
      id: user.id,
      email: user.email,
      emailVerifiedAt: user.emailVerifiedAt?.toISOString() ?? null,
      username: user.username,
      displayName: user.displayName,
      avatarUrl: user.avatarUrl,
      notificationSettings: user.notificationSettings,
      isAdmin: user.isAdmin,
      publicApiKeyPreview: user.publicApiKeyPreview,
      publicApiKeyCreatedAt: user.publicApiKeyCreatedAt?.toISOString() ?? null,
      createdAt: user.createdAt.toISOString(),
      updatedAt: user.updatedAt.toISOString()
    },
    friends: friends.map((friend) => ({
      id: friend.id,
      status: friend.status,
      createdAt: friend.createdAt.toISOString(),
      requester: friend.requester,
      recipient: friend.recipient
    })),
    sessions: sessions.map((session) => ({
      ...session,
      createdAt: session.createdAt.toISOString()
    })),
    memories: memories.map((memory) => ({
      id: memory.id,
      date: memory.date.toISOString().split("T")[0],
      content: memory.content,
      mood: memory.mood,
      moodSource: memory.moodSource,
      isOpen: memory.isOpen,
      shareToken: memory.shareToken,
      createdAt: memory.createdAt.toISOString(),
      updatedAt: memory.updatedAt.toISOString(),
      media: memory.media.map((media) => ({
        id: media.id,
        url: media.url,
        mimeType: media.mimeType,
        createdAt: media.createdAt.toISOString()
      })),
      contributions: memory.contributions.map((contribution) => ({
        id: contribution.id,
        content: contribution.content,
        guestName: contribution.guestName,
        guestAvatarUrl: contribution.guestAvatarUrl,
        mediaUrl: contribution.mediaUrl,
        createdAt: contribution.createdAt.toISOString(),
        contributor: contribution.contributor
      }))
    })),
    chatMessages: chatMessages.map((message) => ({
      ...message,
      createdAt: message.createdAt.toISOString(),
      readAt: message.readAt?.toISOString() ?? null
    })),
    promptSuggestions: promptSuggestions.map((prompt) => ({
      ...prompt,
      createdAt: prompt.createdAt.toISOString()
    })),
    moodClassificationJobs: moodJobs.map((job) => ({
      ...job,
      createdAt: job.createdAt.toISOString(),
      updatedAt: job.updatedAt.toISOString()
    }))
  };
}
