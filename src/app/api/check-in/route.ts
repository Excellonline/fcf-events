import { NextResponse } from "next/server";
import { runCheckIn } from "@/lib/actions/check-in";

export async function POST(request: Request) {
  const payload = await request.json();
  const result = await runCheckIn(payload);
  return NextResponse.json(result, { status: result.result === "success" || result.result === "duplicate" ? 200 : 400 });
}

