import { env } from "@/lib/env";

function getKeyMaterial() {
  if (!env.encryptionKey) {
    throw new Error("APP_ENCRYPTION_KEY is required before storing provider secrets.");
  }

  return Buffer.from(env.encryptionKey, "base64").subarray(0, 32);
}

export async function encryptSecret(value: string) {
  const { createCipheriv, randomBytes } = await import("crypto");
  const iv = randomBytes(12);
  const cipher = createCipheriv("aes-256-gcm", getKeyMaterial(), iv);
  const encrypted = Buffer.concat([cipher.update(value, "utf8"), cipher.final()]);
  const tag = cipher.getAuthTag();
  return Buffer.concat([iv, tag, encrypted]).toString("base64");
}

export async function decryptSecret(value: string) {
  const { createDecipheriv } = await import("crypto");
  const payload = Buffer.from(value, "base64");
  const iv = payload.subarray(0, 12);
  const tag = payload.subarray(12, 28);
  const encrypted = payload.subarray(28);
  const decipher = createDecipheriv("aes-256-gcm", getKeyMaterial(), iv);
  decipher.setAuthTag(tag);
  return Buffer.concat([decipher.update(encrypted), decipher.final()]).toString("utf8");
}

export function maskSecret(value?: string | null) {
  if (!value) return "Not configured";
  if (value.length <= 8) return "••••••••";
  return `${value.slice(0, 4)}••••${value.slice(-4)}`;
}

