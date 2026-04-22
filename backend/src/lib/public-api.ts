import { createHash, randomBytes } from "node:crypto";
import { db } from "../db";

const PUBLIC_API_KEY_PREFIX = "capsul_";
const PUBLIC_API_RATE_LIMIT = 60;
const PUBLIC_API_RATE_WINDOW_MS = 60_000;

const publicApiRateStore = new Map<
  string,
  {
    count: number;
    resetAt: number;
  }
>();

export type PublicApiAuth = {
  userId: string;
  username: string;
  email: string;
  keyHash: string;
};

function hashPublicApiKey(value: string) {
  return createHash("sha256").update(value).digest("hex");
}

function buildPublicApiPreview(key: string) {
  return `${key.slice(0, 14)}...${key.slice(-4)}`;
}

export function issuePublicApiKeyValue() {
  const token = randomBytes(24).toString("hex");
  return `${PUBLIC_API_KEY_PREFIX}${token}`;
}

export async function createPublicApiKey(userId: string) {
  const key = issuePublicApiKeyValue();
  const createdAt = new Date();
  const preview = buildPublicApiPreview(key);

  await db.user.update({
    where: { id: userId },
    data: {
      publicApiKeyHash: hashPublicApiKey(key),
      publicApiKeyPreview: preview,
      publicApiKeyCreatedAt: createdAt
    }
  });

  return {
    key,
    preview,
    createdAt: createdAt.toISOString()
  };
}

export async function revokePublicApiKey(userId: string) {
  await db.user.update({
    where: { id: userId },
    data: {
      publicApiKeyHash: null,
      publicApiKeyPreview: null,
      publicApiKeyCreatedAt: null
    }
  });
}

export async function authenticatePublicApiKey(
  rawKey: string
): Promise<PublicApiAuth | null> {
  const trimmed = rawKey.trim();
  if (!trimmed) return null;

  const keyHash = hashPublicApiKey(trimmed);
  const user = await db.user.findUnique({
    where: { publicApiKeyHash: keyHash },
    select: {
      id: true,
      username: true,
      email: true,
      publicApiKeyHash: true
    }
  });

  if (!user?.publicApiKeyHash) {
    return null;
  }

  return {
    userId: user.id,
    username: user.username,
    email: user.email,
    keyHash: user.publicApiKeyHash
  };
}

export function consumePublicApiRateLimit(keyHash: string) {
  const now = Date.now();
  const current = publicApiRateStore.get(keyHash);
  const entry =
    current && current.resetAt > now
      ? current
      : {
          count: 0,
          resetAt: now + PUBLIC_API_RATE_WINDOW_MS
        };

  const limited = entry.count >= PUBLIC_API_RATE_LIMIT;

  if (!limited) {
    entry.count += 1;
  }

  publicApiRateStore.set(keyHash, entry);

  return {
    limited,
    limit: PUBLIC_API_RATE_LIMIT,
    remaining: limited
      ? 0
      : Math.max(0, PUBLIC_API_RATE_LIMIT - entry.count),
    resetAt: Math.ceil(entry.resetAt / 1000),
    retryAfterSeconds: Math.max(
      1,
      Math.ceil((entry.resetAt - now) / 1000)
    )
  };
}
