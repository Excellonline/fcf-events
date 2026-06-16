"use client";

import { Mail, Send, X } from "lucide-react";
import { useState, useTransition } from "react";
import { toast } from "sonner";
import { sendTicketEmail } from "@/lib/actions/tickets";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

export function SendTicketEmailForm({
  ticketCode,
  defaultEmail,
}: {
  ticketCode: string;
  defaultEmail?: string | null;
}) {
  const [isOpen, setIsOpen] = useState(false);
  const [email, setEmail] = useState(defaultEmail ?? "");
  const [isPending, startTransition] = useTransition();

  function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    startTransition(async () => {
      const result = await sendTicketEmail({ ticketCode, recipientEmail: email });
      if (result.ok) {
        toast.success(result.message);
        setIsOpen(false);
        return;
      }
      toast.error(result.message);
    });
  }

  if (!isOpen) {
    return (
      <Button type="button" variant="outline" onClick={() => setIsOpen(true)}>
        <Mail className="h-4 w-4" aria-hidden />
        Send Ticket
      </Button>
    );
  }

  return (
    <form
      onSubmit={submit}
      className="flex w-full flex-col gap-2 rounded-md border border-white/10 bg-[#111111] p-2 sm:w-[420px] sm:flex-row"
    >
      <Input
        type="email"
        value={email}
        onChange={(event) => setEmail(event.target.value)}
        placeholder="guest@example.com"
        autoComplete="email"
        className="h-10 min-w-0 bg-[#080808]"
        required
      />
      <div className="flex gap-2">
        <Button type="submit" disabled={isPending || !email} className="flex-1 sm:flex-none">
          <Send className="h-4 w-4" aria-hidden />
          Send
        </Button>
        <Button type="button" variant="ghost" size="icon" onClick={() => setIsOpen(false)} aria-label="Cancel email send">
          <X className="h-4 w-4" aria-hidden />
        </Button>
      </div>
    </form>
  );
}
