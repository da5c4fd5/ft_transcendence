import { createCipheriv, createDecipheriv, randomBytes } from "crypto";

function getKey(): Buffer {
  if (!process.env.MFA_ENCRYPTION_KEY) {
    throw new Error("MFA_ENCRYPTION_KEY must be set (32 bytes, hex-encoded)");
  }
  const key = Buffer.from(process.env.MFA_ENCRYPTION_KEY, "hex");
  if (key.length !== 32)
    throw new Error("MFA_ENCRYPTION_KEY must be 64 hex chars (32 bytes)");
  return key;
}

/** Encrypt a TOTP secret for at-rest storage. Returns `iv:ciphertext:tag` (hex). */
export function encryptSecret(plaintext: string): string {
  const iv = randomBytes(12);
  const cipher = createCipheriv("aes-256-gcm", getKey(), iv);
  const enc = Buffer.concat([cipher.update(plaintext, "utf8"), cipher.final()]);
  const tag = cipher.getAuthTag();
  return `${iv.toString("hex")}:${enc.toString("hex")}:${tag.toString("hex")}`;
}

/** Decrypt a TOTP secret stored by {@link encryptSecret}. */
export function decryptSecret(encoded: string): string {
  const [ivHex, encHex, tagHex] = encoded.split(":");
  const decipher = createDecipheriv(
    "aes-256-gcm",
    getKey(),
    Buffer.from(ivHex, "hex")
  );
  decipher.setAuthTag(Buffer.from(tagHex, "hex"));
  return Buffer.concat([
    decipher.update(Buffer.from(encHex, "hex")),
    decipher.final()
  ]).toString("utf8");
}
