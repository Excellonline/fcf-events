import { timingSafeEqual } from "crypto";
import { NextResponse } from "next/server";
import { env, isProduction } from "@/lib/env";

export function clientIp(headers: { get(name: string): string | null }) {
  const forwarded = headers.get("x-forwarded-for")?.split(",")[0]?.trim();
  return forwarded || headers.get("x-real-ip") || "unknown";
}

export async function readJsonBody(request: Request): Promise<{ ok: true; data: unknown } | { ok: false; response: NextResponse }> {
  const contentLength = Number(request.headers.get("content-length") ?? 0);
  if (contentLength > 64_000) {
    return {
      ok: false,
      response: NextResponse.json({ ok: false, message: "Request body is too large." }, { status: 413 }),
    };
  }

  try {
    return { ok: true, data: await request.json() };
  } catch {
    return {
      ok: false,
      response: NextResponse.json({ ok: false, message: "Invalid JSON payload." }, { status: 400 }),
    };
  }
}

export function isAuthorizedSharedSecret(request: Request, secret: string | undefined, headerName: string) {
  if (!secret) return !isProduction();

  const url = new URL(request.url);
  const authorization = request.headers.get("authorization") ?? "";
  const bearer = authorization.match(/^Bearer\s+(.+)$/i)?.[1]?.trim();
  const suppliedSecret = request.headers.get(headerName) ?? bearer ?? url.searchParams.get("token");
  return constantTimeEquals(suppliedSecret, secret);
}

export function isAuthorizedCronRequest(request: Request) {
  return isAuthorizedSharedSecret(request, env.cronSecret, "x-cron-secret");
}

export async function verifyTwilioRequest(request: Request, form: FormData) {
  if (!env.twilioAuthToken) return !isProduction();

  const suppliedSignature = request.headers.get("x-twilio-signature");
  if (!suppliedSignature) return false;

  const url = new URL(request.url);
  const configuredBaseUrl = process.env.NEXT_PUBLIC_APP_URL ? new URL(env.appUrl) : null;
  const validationUrl = configuredBaseUrl
    ? `${configuredBaseUrl.origin}${url.pathname}${url.search}`
    : request.url;

  const params = [...form.entries()]
    .filter((entry): entry is [string, string] => typeof entry[1] === "string")
    .sort(([leftKey, leftValue], [rightKey, rightValue]) =>
      leftKey === rightKey ? leftValue.localeCompare(rightValue) : leftKey.localeCompare(rightKey),
    );
  const signatureBase = `${validationUrl}${params.map(([key, value]) => `${key}${value}`).join("")}`;
  const { createHmac } = await import("crypto");
  const expectedSignature = createHmac("sha1", env.twilioAuthToken).update(signatureBase).digest("base64");

  return constantTimeEquals(suppliedSignature, expectedSignature);
}

export function constantTimeEquals(left: string | null | undefined, right: string | null | undefined) {
  if (!left || !right) return false;

  const leftBuffer = Buffer.from(left);
  const rightBuffer = Buffer.from(right);
  if (leftBuffer.length !== rightBuffer.length) return false;

  return cryptoTimingSafeEqual(leftBuffer, rightBuffer);
}

function cryptoTimingSafeEqual(left: Buffer, right: Buffer) {
  try {
    return timingSafeEqual(left, right);
  } catch {
    return false;
  }
}
