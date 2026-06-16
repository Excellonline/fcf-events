import { RefreshCw, Save } from "lucide-react";
import { PageHeader } from "@/components/page-header";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { saveAirtableSettings, runAirtableSync } from "@/lib/actions/airtable";
import { demoOrganizationId } from "@/lib/demo-data";

export default function AirtableSyncPage() {
  async function saveSettings(formData: FormData) {
    "use server";
    await saveAirtableSettings(formData);
  }

  async function syncNow() {
    "use server";
    await runAirtableSync(demoOrganizationId);
  }

  return (
    <>
      <PageHeader eyebrow="Integration" title="Airtable Sync" description="Server-side sync configuration, field mapping, manual runs, and retry-safe logs." />
      <div className="grid gap-4 lg:grid-cols-[1fr_0.7fr]">
        <Card>
          <CardHeader>
            <CardTitle>Connection</CardTitle>
          </CardHeader>
          <CardContent>
            <form action={saveSettings} className="space-y-4">
              <input type="hidden" name="organizationId" value={demoOrganizationId} />
              <Field label="API token"><Input name="apiToken" type="password" placeholder="Stored encrypted server-side" /></Field>
              <Field label="Base ID"><Input name="baseId" placeholder="app..." required /></Field>
              <div className="grid gap-4 md:grid-cols-2">
                <Field label="Events table"><Input name="eventsTableName" defaultValue="Events" required /></Field>
                <Field label="Sessions table"><Input name="sessionsTableName" defaultValue="Sessions" required /></Field>
                <Field label="Attendees table"><Input name="attendeesTableName" defaultValue="Attendees" required /></Field>
                <Field label="Registrations table"><Input name="registrationsTableName" defaultValue="Registrations" required /></Field>
                <Field label="Tickets table"><Input name="ticketsTableName" defaultValue="Tickets" required /></Field>
              </div>
              <Button type="submit">
                <Save className="h-4 w-4" aria-hidden />
                Save Settings
              </Button>
            </form>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Manual Sync</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-sm leading-6 text-[#999999]">
              Sync Now records a server-side sync attempt. Production sync requires Airtable token, base ID, and complete field mappings.
            </p>
            <form action={syncNow}>
              <Button type="submit" variant="outline">
                <RefreshCw className="h-4 w-4" aria-hidden />
                Sync Now
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    </>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="space-y-2">
      <Label>{label}</Label>
      {children}
    </div>
  );
}
