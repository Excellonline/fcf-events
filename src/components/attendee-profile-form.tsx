"use client";

import { useRouter } from "next/navigation";
import { Save } from "lucide-react";
import { useTransition, type FormEvent, type ReactNode } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { updateAttendeeAction } from "@/lib/actions/attendees";
import type { AttendeeDetail } from "@/lib/types";

export function AttendeeProfileForm({ attendee }: { attendee: AttendeeDetail }) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const formData = new FormData(event.currentTarget);

    startTransition(async () => {
      const result = await updateAttendeeAction(formData);
      if (result.ok) {
        toast.success(result.message);
        router.refresh();
        return;
      }

      toast.error(result.message);
    });
  }

  return (
    <form onSubmit={submit} className="space-y-5">
      <input type="hidden" name="attendeeId" value={attendee.id} />
      <div className="grid gap-4 md:grid-cols-2">
        <Field id="firstName" label="First name">
          <Input id="firstName" name="firstName" defaultValue={attendee.first_name} autoComplete="given-name" required />
        </Field>
        <Field id="lastName" label="Last name">
          <Input id="lastName" name="lastName" defaultValue={attendee.last_name} autoComplete="family-name" required />
        </Field>
        <Field id="email" label="Email">
          <Input id="email" name="email" type="email" defaultValue={attendee.email ?? ""} autoComplete="email" />
        </Field>
        <Field id="phone" label="Phone">
          <Input id="phone" name="phone" defaultValue={attendee.phone ?? ""} autoComplete="tel" />
        </Field>
        <Field id="company" label="Company">
          <Input id="company" name="company" defaultValue={attendee.company ?? ""} autoComplete="organization" />
        </Field>
        <Field id="roleTitle" label="Role title">
          <Input id="roleTitle" name="roleTitle" defaultValue={attendee.role_title ?? ""} autoComplete="organization-title" />
        </Field>
        <Field id="dateOfBirth" label="Date of birth">
          <Input id="dateOfBirth" name="dateOfBirth" type="date" defaultValue={attendee.date_of_birth?.slice(0, 10) ?? ""} />
        </Field>
      </div>

      <div className="grid gap-3 sm:grid-cols-2">
        <ConsentCheckbox name="smsConsent" label="SMS consent" defaultChecked={attendee.sms_consent_status} />
        <ConsentCheckbox name="emailConsent" label="Email consent" defaultChecked={attendee.email_consent_status} />
      </div>

      <Field id="notes" label="Operational notes">
        <Textarea id="notes" name="notes" defaultValue={attendee.notes ?? ""} placeholder="Internal notes for staff" />
      </Field>

      <Button type="submit" disabled={isPending}>
        <Save className="h-4 w-4" aria-hidden />
        {isPending ? "Saving" : "Save Attendee"}
      </Button>
    </form>
  );
}

function Field({ id, label, children }: { id: string; label: string; children: ReactNode }) {
  return (
    <div className="space-y-2">
      <Label htmlFor={id}>{label}</Label>
      {children}
    </div>
  );
}

function ConsentCheckbox({
  name,
  label,
  defaultChecked,
}: {
  name: string;
  label: string;
  defaultChecked: boolean;
}) {
  return (
    <label className="flex items-center gap-3 rounded-md border border-white/10 bg-[#0b0b0b] px-3 py-2 text-sm text-[#dddddd]">
      <input
        name={name}
        type="checkbox"
        defaultChecked={defaultChecked}
        className="h-4 w-4 rounded border-white/20 accent-[#e50913]"
      />
      {label}
    </label>
  );
}
