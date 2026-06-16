import { NextResponse } from "next/server";
import { runAirtableSyncJob } from "@/lib/airtable/sync";
import { demoOrganizationId } from "@/lib/demo-data";
import { isAuthorizedCronRequest } from "@/lib/security/request";

export async function POST(request: Request) {
  if (!isAuthorizedCronRequest(request)) {
    return NextResponse.json({ ok: false, message: "Unauthorized sync." }, { status: 401 });
  }

  const result = await runAirtableSyncJob(demoOrganizationId);
  return NextResponse.json(result);
}
