import { NextResponse } from "next/server";
import { registerForEvent } from "@/lib/actions/registration";
import { rateLimit } from "@/lib/security/rate-limit";
import { clientIp, readJsonBody } from "@/lib/security/request";

export async function POST(request: Request) {
  const limited = rateLimit(`registration:${clientIp(request.headers)}`, 30, 60 * 60 * 1000);
  if (!limited.allowed) {
    return NextResponse.json({ ok: false, message: "Too many registration attempts. Please try again later." }, { status: 429 });
  }

  const payload = await readJsonBody(request);
  if (!payload.ok) return payload.response;

  const result = await registerForEvent(payload.data);
  return NextResponse.json(result, { status: result.ok ? 200 : 400 });
}
