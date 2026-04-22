import { rm } from "node:fs/promises";
import { db } from "../db";

const MEDIA_PREFIX = "/api/media/";
const AVATAR_PREFIX = "/avatars/";

function getStoredFilePath(url: string) {
  if (url.startsWith(MEDIA_PREFIX)) {
    return {
      type: "media" as const,
      path: `/app/uploads/${url.slice(MEDIA_PREFIX.length)}`
    };
  }

  if (url.startsWith(AVATAR_PREFIX)) {
    return {
      type: "avatar" as const,
      path: `/app/public/avatars/${url.slice(AVATAR_PREFIX.length)}`
    };
  }

  return null;
}

export async function deleteStoredFileIfUnused(url?: string | null) {
  if (!url) return;

  const storedFile = getStoredFilePath(url);
  if (!storedFile) return;

  const [mediaRefs, contributionRefs, avatarRefs] = await Promise.all([
    storedFile.type === "media" ? db.media.count({ where: { url } }) : 0,
    db.contribution.count({
      where: {
        OR: [{ mediaUrl: url }, { guestAvatarUrl: url }]
      }
    }),
    storedFile.type === "avatar" ? db.user.count({ where: { avatarUrl: url } }) : 0
  ]);

  if (mediaRefs + contributionRefs + avatarRefs > 0) {
    return;
  }

  await rm(storedFile.path, { force: true });
}

export async function deleteStoredFilesIfUnused(
  urls: Array<string | null | undefined>
) {
  const uniqueUrls = [...new Set(urls.filter((url): url is string => !!url))];
  await Promise.all(uniqueUrls.map((url) => deleteStoredFileIfUnused(url)));
}

export async function collectMemoryFileUrls(memoryId: string) {
  const memory = await db.memory.findUnique({
    where: { id: memoryId },
    select: {
      media: {
        select: { url: true }
      },
      contributions: {
        select: {
          guestAvatarUrl: true,
          mediaUrl: true
        }
      }
    }
  });

  if (!memory) return [];

  return [
    ...memory.media.map((media) => media.url),
    ...memory.contributions.flatMap((contribution) => [
      contribution.guestAvatarUrl,
      contribution.mediaUrl
    ])
  ];
}

export async function collectUserOwnedFileUrls(userId: string) {
  const user = await db.user.findUnique({
    where: { id: userId },
    select: {
      avatarUrl: true,
      memories: {
        select: {
          id: true,
          media: {
            select: { url: true }
          },
          contributions: {
            select: {
              guestAvatarUrl: true,
              mediaUrl: true
            }
          }
        }
      }
    }
  });

  if (!user) return [];

  return [
    user.avatarUrl,
    ...user.memories.flatMap((memory) => [
      ...memory.media.map((media) => media.url),
      ...memory.contributions.flatMap((contribution) => [
        contribution.guestAvatarUrl,
        contribution.mediaUrl
      ])
    ])
  ];
}
