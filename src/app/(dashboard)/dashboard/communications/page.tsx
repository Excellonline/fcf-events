import { MessageSquare, Send } from "lucide-react";
import { PageHeader } from "@/components/page-header";
import { SmsTestPanel } from "@/components/sms-test-panel";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

export default function CommunicationsPage() {
  return (
    <>
      <PageHeader eyebrow="SMS" title="Communications" description="Templates, test sends, reminders, opt-outs, delivery history, and bulk message workflows." />
      <div className="grid gap-4 lg:grid-cols-[0.8fr_1fr]">
        <Card>
          <CardHeader>
            <CardTitle>Test SMS</CardTitle>
          </CardHeader>
          <CardContent>
            <SmsTestPanel />
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Reminder Templates</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {["48h reminder", "24h reminder", "3h arrival reminder", "Session reminder"].map((template) => (
              <div key={template} className="rounded-md border border-white/10 p-4">
                <div className="flex items-center justify-between">
                  <p className="font-medium text-white">{template}</p>
                  <Badge>SMS</Badge>
                </div>
                <p className="mt-2 text-sm leading-6 text-[#999999]">
                  Hey {"{{first_name}}"}. Your FCF event spot at {"{{event}}"} is confirmed for {"{{event_start_time}}"}. Reply STOP to unsubscribe.
                </p>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>
      <div className="mt-4 grid gap-4 md:grid-cols-3">
        {[
          { label: "Scheduled reminders", value: "4", icon: MessageSquare },
          { label: "Queued sends", value: "0", icon: Send },
          { label: "Opt-outs", value: "0", icon: MessageSquare },
        ].map((item) => (
          <Card key={item.label}>
            <CardContent className="flex items-center gap-4 p-5">
              <item.icon className="h-6 w-6 text-[#e50913]" aria-hidden />
              <div>
                <p className="text-2xl font-semibold">{item.value}</p>
                <p className="text-sm text-[#999999]">{item.label}</p>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </>
  );
}

