import { NextResponse } from "next/server";
import { env } from "@/lib/env";
import { processZeffyCompletedPayment } from "@/lib/payments/zeffy";
import { isAuthorizedSharedSecret } from "@/lib/security/request";
import { listZeffyPayments } from "@/lib/zeffy";

export async function POST(request: Request) {
  if (!isAuthorizedSync(request)) {
    return NextResponse.json({ ok: false, message: "Unauthorized sync." }, { status: 401 });
  }

  try {
    const url = new URL(request.url);
    const createdGte = url.searchParams.get("created_gte");
    const payments = await listZeffyPayments({
      status: "succeeded",
      type: "online",
      limit: 100,
      "created[gte]": createdGte ? Number(createdGte) : undefined,
    });

    const results = [];
    for (const payment of payments.data) {
      results.push(await processZeffyCompletedPayment(payment));
    }

    return NextResponse.json({
      ok: true,
      processed: results.length,
      matched: results.filter((result) => result.matched).length,
      hasMore: payments.has_more,
      nextCursor: payments.next_cursor,
      results,
    });
  } catch (error) {
    return NextResponse.json(
      {
        ok: false,
        message: error instanceof Error ? error.message : "Could not sync Zeffy payments.",
      },
      { status: 500 },
    );
  }
}

function isAuthorizedSync(request: Request) {
  return isAuthorizedSharedSecret(request, env.zeffySyncSecret, "x-zeffy-sync-secret");
}
