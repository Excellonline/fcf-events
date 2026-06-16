"use client";

import { useState, useTransition } from "react";
import { toast } from "sonner";
import { Send } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { sendTestSms } from "@/lib/actions/twilio";
import { demoOrganizationId } from "@/lib/demo-data";

export function SmsTestPanel({ organizationId = demoOrganizationId }: { organizationId?: string }) {
  const [to, setTo] = useState("");
  const [body, setBody] = useState("Hey {{first_name}}. Your FCF event spot is confirmed. Reply STOP to unsubscribe.");
  const [isPending, startTransition] = useTransition();

  function submit() {
    startTransition(async () => {
      const result = await sendTestSms({ organizationId, to, body });
      if (result.ok) toast.success(result.message);
      else toast.error(result.message);
    });
  }

  return (
    <div className="space-y-4">
      <div className="space-y-2">
        <Label>Test number</Label>
        <Input value={to} onChange={(event) => setTo(event.target.value)} placeholder="+14165550123" />
      </div>
      <div className="space-y-2">
        <Label>Message</Label>
        <Textarea value={body} onChange={(event) => setBody(event.target.value)} />
      </div>
      <Button onClick={submit} disabled={isPending || !to || !body}>
        <Send className="h-4 w-4" aria-hidden />
        Send Test SMS
      </Button>
    </div>
  );
}

