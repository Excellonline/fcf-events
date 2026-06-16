import { NextResponse } from "next/server";
import { runCheckIn } from "@/lib/actions/check-in";
import { readJsonBody } from "@/lib/security/request";

export async function POST(request: Request) {
  const payload = await readJsonBody(request);
  if (!payload.ok) return payload.response;

  const result = await runCheckIn(payload.data);
  return NextResponse.json(result, { status: result.result === "success" || result.result === "duplicate" ? 200 : 400 });
}
