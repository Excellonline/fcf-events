import { NextResponse } from "next/server";
import { runAirtableSync } from "@/lib/actions/airtable";
import { demoOrganizationId } from "@/lib/demo-data";

export async function POST() {
  const result = await runAirtableSync(demoOrganizationId);
  return NextResponse.json(result);
}

