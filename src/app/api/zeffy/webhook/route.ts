import { NextResponse } from "next/server";
import { env } from "@/lib/env";
import { processZeffyCompletedPayment } from "@/lib/payments/zeffy";
import { isAuthorizedSharedSecret, readJsonBody } from "@/lib/security/request";
import type { ZeffyPaymentCompletedEvent } from "@/lib/zeffy";

export async function POST(request: Request) {
  if (!isAuthorizedWebhook(request)) {
    return NextResponse.json({ ok: false, message: "Unauthorized webhook." }, { status: 401 });
  }

  const parsedPayload = await readJsonBody(request);
  if (!parsedPayload.ok) return parsedPayload.response;

  const payload = parsedPayload.data as ZeffyPaymentCompletedEvent;

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
  return isAuthorizedSharedSecret(request, env.zeffyWebhookSecret, "x-zeffy-webhook-secret");
}
