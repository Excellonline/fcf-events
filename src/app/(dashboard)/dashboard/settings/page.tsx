import { Save } from "lucide-react";
import { PageHeader } from "@/components/page-header";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { saveTwilioSettings } from "@/lib/actions/twilio";
import { demoOrganizationId } from "@/lib/demo-data";

export default function SettingsPage() {
  async function saveSettings(formData: FormData) {
    "use server";
    await saveTwilioSettings(formData);
  }

  return (
    <>
      <PageHeader eyebrow="Configuration" title="Settings" description="Organization profile, consent text, roles, Twilio, Airtable, data retention, and audit-sensitive controls." />
      <div className="grid gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Twilio SMS</CardTitle>
          </CardHeader>
          <CardContent>
            <form action={saveSettings} className="space-y-4">
              <input type="hidden" name="organizationId" value={demoOrganizationId} />
              <Field label="Account SID"><Input name="accountSid" placeholder="AC..." required /></Field>
              <Field label="Auth token"><Input name="authToken" type="password" placeholder="Stored encrypted server-side" /></Field>
              <Field label="Twilio phone number"><Input name="twilioPhoneNumber" placeholder="+14165550123" /></Field>
              <Field label="Messaging Service SID"><Input name="messagingServiceSid" placeholder="MG..." /></Field>
              <div className="grid gap-4 md:grid-cols-2">
                <Field label="Sender name"><Input name="defaultSenderName" defaultValue="FCF Events" required /></Field>
                <Field label="Timezone"><Input name="defaultTimezone" defaultValue="America/Toronto" required /></Field>
              </div>
              <Field label="Default footer"><Textarea name="defaultFooter" defaultValue="Reply STOP to unsubscribe." required /></Field>
              <Field label="Compliance contact"><Input name="complianceContact" placeholder="ops@example.com" /></Field>
              <div className="grid gap-4 md:grid-cols-2">
                <Field label="Quiet hours start"><Input name="quietHoursStart" type="time" /></Field>
                <Field label="Quiet hours end"><Input name="quietHoursEnd" type="time" /></Field>
              </div>
              <Button type="submit">
                <Save className="h-4 w-4" aria-hidden />
                Save Twilio Settings
              </Button>
            </form>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Consent Defaults</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <Field label="SMS consent copy">
              <Textarea defaultValue="I consent to receive event-related SMS reminders from FCF Events. Reply STOP to unsubscribe." />
            </Field>
            <Field label="Cannabis compliance note">
              <Textarea defaultValue="Organizer must confirm applicable federal, provincial, territorial, and venue rules before publishing this event." />
            </Field>
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
