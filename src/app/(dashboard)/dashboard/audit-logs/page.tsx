import { PageHeader } from "@/components/page-header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

const logs = [
  ["registration.created", "registration", "Public registration captured with consent snapshot."],
  ["check_in.success", "ticket", "Ticket checked in for event scope."],
  ["sms.sent", "message_send", "Reminder sent with provider SID."],
  ["twilio.settings.updated", "twilio_config", "Credentials changed by Owner/Admin."],
  ["airtable.sync.skipped", "airtable_sync", "Sync skipped until mappings are complete."],
];

export default function AuditLogsPage() {
  return (
    <>
      <PageHeader eyebrow="Governance" title="Audit Logs" description="Sensitive operational actions, check-in attempts, provider changes, exports, and privacy workflows." />
      <Card>
        <CardHeader>
          <CardTitle>Recent Activity</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {logs.map(([action, entity, detail]) => (
            <div key={action} className="rounded-md border border-white/10 p-4">
              <div className="flex items-center justify-between">
                <p className="font-mono text-sm text-white">{action}</p>
                <Badge variant="muted">{entity}</Badge>
              </div>
              <p className="mt-2 text-sm text-[#999999]">{detail}</p>
            </div>
          ))}
        </CardContent>
      </Card>
    </>
  );
}

