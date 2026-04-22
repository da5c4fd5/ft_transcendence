import { status } from "elysia";
import { mkdir } from "node:fs/promises";
import { db } from "../../db";
import type { ContributionsModel } from "./model";
import { assertImageByteSize, assertImageMimeType } from "../../lib/images";

const UPLOAD_DIR = "/app/uploads";
const CONTRIBUTION_INCLUDE = {
  contributor: { select: { username: true, avatarUrl: true } }
} as const;

function extensionForMime(mimeType: string) {
  const subtype = mimeType.split("/")[1] ?? "bin";
  return subtype.replace("jpeg", "jpg").replace(/[^a-z0-9]/gi, "") || "bin";
}

async function storeInlineImage(imageUrl?: string) {
  if (!imageUrl) return null;
  if (imageUrl.startsWith("/api/media/") || imageUrl.startsWith("/avatars/")) {
    return imageUrl;
  }

  const match = imageUrl.match(/^data:(image\/[a-zA-Z0-9.+-]+);base64,([A-Za-z0-9+/=]+)$/);
  if (!match) throw status(400, { message: "Invalid image data" });

  const [, mimeType, base64] = match;
  const bytes = Buffer.from(base64, "base64");
  assertImageMimeType(mimeType);
  assertImageByteSize(bytes.byteLength);

  await mkdir(UPLOAD_DIR, { recursive: true });
  const filename = `${crypto.randomUUID()}.${extensionForMime(mimeType)}`;
  await Bun.write(`${UPLOAD_DIR}/${filename}`, bytes);
  return `/api/media/${filename}`;
}

export abstract class ContributionsService {
  static async listByMemory(memoryId: string, requesterId?: string) {
    const memory = await db.memory.findUnique({ where: { id: memoryId } });
    if (!memory) throw status(404, { message: "Memory not found" });
    if (!memory.isOpen && memory.userId !== requesterId) {
      throw status(403, { message: "Forbidden" });
    }
    return db.contribution.findMany({
      where: { memoryId },
      orderBy: { createdAt: "asc" },
      include: CONTRIBUTION_INCLUDE
    });
  }

  static async add(
    memoryId: string,
    data: ContributionsModel["addBody"],
    contributorId?: string
  ) {
    const memory = await db.memory.findUnique({ where: { id: memoryId } });
    if (!memory) throw status(404, { message: "Memory not found" });
    if (!memory.isOpen)
      throw status(403, {
        message: "This memory is not open for contributions"
      });
    const [guestAvatarUrl, mediaUrl] = await Promise.all([
      contributorId ? Promise.resolve(null) : storeInlineImage(data.guestAvatarUrl),
      storeInlineImage(data.mediaUrl)
    ]);
    return db.contribution.create({
      data: {
        memoryId,
        content: data.content,
        guestName: data.guestName,
        guestAvatarUrl,
        mediaUrl,
        contributorId: contributorId ?? null
      },
      include: CONTRIBUTION_INCLUDE
    });
  }

  static async edit(
    id: string,
    requesterId: string,
    data: ContributionsModel["editBody"]
  ) {
    const contribution = await db.contribution.findUnique({ where: { id } });
    if (!contribution) throw status(404, { message: "Contribution not found" });
    if (contribution.contributorId !== requesterId)
      throw status(403, { message: "Forbidden" });
    const mediaUrl =
      data.mediaUrl === undefined ? undefined : await storeInlineImage(data.mediaUrl);
    return db.contribution.update({
      where: { id },
      data: {
        content: data.content,
        ...(mediaUrl !== undefined ? { mediaUrl } : {})
      },
      include: CONTRIBUTION_INCLUDE
    });
  }

  static async remove(id: string, requesterId: string) {
    const contribution = await db.contribution.findUnique({
      where: { id },
      include: { memory: { select: { userId: true } } }
    });
    if (!contribution) throw status(404, { message: "Contribution not found" });
    const isOwner = contribution.memory.userId === requesterId;
    const isContributor = contribution.contributorId === requesterId;
    if (!isOwner && !isContributor) throw status(403, { message: "Forbidden" });
    await db.contribution.delete({ where: { id } });
    return status(204);
  }
}
