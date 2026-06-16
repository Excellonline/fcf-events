import { NextResponse } from "next/server";
import { searchCheckInGuests } from "@/lib/actions/check-in";

export async function POST(request: Request) {
  const payload = await request.json();
  const result = await searchCheckInGuests(payload);
  return NextResponse.json(result, { status: result.ok ? 200 : 400 });
}
