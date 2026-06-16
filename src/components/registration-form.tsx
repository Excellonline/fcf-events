"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useRouter } from "next/navigation";
import { useTransition } from "react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { SelectField } from "@/components/ui/select-field";
import { registerForEvent } from "@/lib/actions/registration";
import { registrationSchema } from "@/lib/validation";
import { currency } from "@/lib/utils";
import type { EventSummary, SessionSummary, TicketTypeSummary } from "@/lib/types";

type RegistrationValues = z.infer<typeof registrationSchema>;

export function RegistrationForm({
  event,
  ticketTypes,
  sessions,
}: {
  event: EventSummary;
  ticketTypes: TicketTypeSummary[];
  sessions: SessionSummary[];
}) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const form = useForm<RegistrationValues>({
    resolver: zodResolver(registrationSchema),
    defaultValues: {
      eventId: event.id,
      ticketTypeId: ticketTypes[0]?.id,
      sessionIds: [],
      firstName: "",
      lastName: "",
      email: "",
      phone: "",
      company: "",
      roleTitle: "",
      dateOfBirth: "",
      discountCode: "",
      smsConsent: false,
      emailConsent: false,
      privacyAccepted: false,
    },
  });

  function onSubmit(values: RegistrationValues) {
    startTransition(async () => {
      const result = await registerForEvent(values);
      if (!result.ok || !result.ticketCode) {
        toast.error(result.message);
        return;
      }
      toast.success("Registration confirmed");
      router.push(`/ticket/${encodeURIComponent(result.ticketCode)}`);
    });
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Register</CardTitle>
      </CardHeader>
      <CardContent>
        <form className="space-y-4" onSubmit={form.handleSubmit(onSubmit)}>
          <input type="hidden" {...form.register("eventId")} />
          <div className="space-y-2">
            <Label>Ticket type</Label>
            <SelectField
              {...form.register("ticketTypeId")}
              options={ticketTypes.map((ticket) => ({
                value: ticket.id,
                label: `${ticket.name} · ${currency(ticket.price, ticket.currency)}`,
              }))}
            />
          </div>
          {sessions.length ? (
            <div className="rounded-md border border-white/10 p-4">
              <p className="text-sm font-medium text-white">Sessions</p>
              <div className="mt-3 space-y-2">
                {sessions.map((session) => (
                  <label key={session.id} className="flex items-center gap-3 text-sm text-[#dddddd]">
                    <input
                      type="checkbox"
                      value={session.id}
                      className="h-4 w-4 accent-[#e50913]"
                      {...form.register("sessionIds")}
                    />
                    <span>{session.title}</span>
                  </label>
                ))}
              </div>
            </div>
          ) : null}
          <div className="grid gap-4 md:grid-cols-2">
            <Field label="First name" error={form.formState.errors.firstName?.message}>
              <Input {...form.register("firstName")} autoComplete="given-name" />
            </Field>
            <Field label="Last name" error={form.formState.errors.lastName?.message}>
              <Input {...form.register("lastName")} autoComplete="family-name" />
            </Field>
            <Field label="Email" error={form.formState.errors.email?.message}>
              <Input type="email" {...form.register("email")} autoComplete="email" />
            </Field>
            <Field label="Phone" error={form.formState.errors.phone?.message}>
              <Input {...form.register("phone")} autoComplete="tel" />
            </Field>
            <Field label="Company">
              <Input {...form.register("company")} />
            </Field>
            <Field label="Role / title">
              <Input {...form.register("roleTitle")} />
            </Field>
            <Field label="Date of birth" error={form.formState.errors.dateOfBirth?.message}>
              <Input type="date" {...form.register("dateOfBirth")} />
            </Field>
            <Field label="Discount code">
              <Input {...form.register("discountCode")} />
            </Field>
          </div>
          <div className="space-y-3 rounded-md border border-white/10 p-4">
            <label className="flex gap-3 text-sm text-[#dddddd]">
              <input type="checkbox" className="mt-1 h-4 w-4 accent-[#e50913]" {...form.register("smsConsent")} />
              <span>I consent to receive event-related SMS reminders from FCF Events. Reply STOP to unsubscribe.</span>
            </label>
            <label className="flex gap-3 text-sm text-[#dddddd]">
              <input type="checkbox" className="mt-1 h-4 w-4 accent-[#e50913]" {...form.register("emailConsent")} />
              <span>I consent to receive event-related email confirmations and reminders.</span>
            </label>
            <label className="flex gap-3 text-sm text-[#dddddd]">
              <input type="checkbox" className="mt-1 h-4 w-4 accent-[#e50913]" {...form.register("privacyAccepted")} />
              <span>I confirm I meet the event age requirement and accept the privacy terms.</span>
            </label>
            {form.formState.errors.privacyAccepted?.message ? (
              <p className="text-sm text-red-300">{form.formState.errors.privacyAccepted.message}</p>
            ) : null}
          </div>
          <Button type="submit" size="lg" className="w-full" disabled={isPending}>
            Complete Registration
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}

function Field({ label, error, children }: { label: string; error?: string; children: React.ReactNode }) {
  return (
    <div className="space-y-2">
      <Label>{label}</Label>
      {children}
      {error ? <p className="text-sm text-red-300">{error}</p> : null}
    </div>
  );
}

