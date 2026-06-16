import { NextResponse } from "next/server";
import { searchCheckInGuests } from "@/lib/actions/check-in";
import { readJsonBody } from "@/lib/security/request";

export async function POST(request: Request) {
  const payload = await readJsonBody(request);
  if (!payload.ok) return payload.response;

  const result = await searchCheckInGuests(payload.data);
  return NextResponse.json(result, { status: result.ok ? 200 : 400 });
}
