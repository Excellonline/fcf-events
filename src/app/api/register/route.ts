import { NextResponse } from "next/server";
import { registerForEvent } from "@/lib/actions/registration";

export async function POST(request: Request) {
  const payload = await request.json();
  const result = await registerForEvent(payload);
  return NextResponse.json(result, { status: result.ok ? 200 : 400 });
}

