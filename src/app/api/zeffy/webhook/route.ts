import { NextResponse } from "next/server";
import { env } from "@/lib/env";
import { processZeffyCompletedPayment } from "@/lib/payments/zeffy";
import type { ZeffyPaymentCompletedEvent } from "@/lib/zeffy";

export async function POST(request: Request) {
  if (!isAuthorizedWebhook(request)) {
    return NextResponse.json({ ok: false, message: "Unauthorized webhook." }, { status: 401 });
  }

  let payload: ZeffyPaymentCompletedEvent;
  try {
    payload = (await request.json()) as ZeffyPaymentCompletedEvent;
  } catch {
    return NextResponse.json({ ok: false, message: "Invalid JSON payload." }, { status: 400 });
  }

  if (payload.type !== "payment.completed" || !payload.data) {
    return NextResponse.json({ ok: true, matched: false, message: "Ignored unsupported Zeffy event." });
  }

  try {
    const result = await processZeffyCompletedPayment(payload.data);
    return NextResponse.json({ ...result, eventId: payload.id }, { status: result.ok ? 200 : 500 });
  } catch (error) {
    return NextResponse.json(
      {
        ok: false,
        matched: false,
        message: error instanceof Error ? error.message : "Could not process Zeffy webhook.",
      },
      { status: 500 },
    );
  }
}

function isAuthorizedWebhook(request: Request) {
  if (!env.zeffyWebhookSecret) return true;

  const url = new URL(request.url);
  const suppliedSecret = request.headers.get("x-zeffy-webhook-secret") ?? url.searchParams.get("token");
  return suppliedSecret === env.zeffyWebhookSecret;
}
