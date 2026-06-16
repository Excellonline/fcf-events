import { NextResponse } from "next/server";
import { createWalkUpCheckIn } from "@/lib/actions/check-in";

export async function POST(request: Request) {
  const payload = await request.json();
  const result = await createWalkUpCheckIn(payload);
  return NextResponse.json(result, { status: result.ok ? 200 : 400 });
}
