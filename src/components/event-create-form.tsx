"use client";

import { useState, useTransition, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { CalendarPlus, Plus, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { SelectField } from "@/components/ui/select-field";
import { Textarea } from "@/components/ui/textarea";
import { createEventAction } from "@/lib/actions/events";

type TicketRow = {
  key: string;
};

const statusOptions = [
  { label: "Draft", value: "draft" },
  { label: "Published", value: "published" },
  { label: "Cancelled", value: "cancelled" },
  { label: "Past", value: "past" },
];

const eventVisibilityOptions = [
  { label: "Private", value: "private" },
  { label: "Public", value: "public" },
  { label: "Unlisted", value: "unlisted" },
];

const ticketVisibilityOptions = [
  { label: "Public", value: "public" },
  { label: "Private", value: "private" },
  { label: "Hidden", value: "hidden" },
];

export function EventCreateForm() {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [ticketRows, setTicketRows] = useState<TicketRow[]>([newTicketRow()]);

  function addTicketRow() {
    setTicketRows((rows) => [...rows, newTicketRow()]);
  }

  function removeTicketRow(key: string) {
    setTicketRows((rows) => rows.filter((row) => row.key !== key));
  }

  function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = event.currentTarget;
    const formData = new FormData(form);

    startTransition(async () => {
      const result = await createEventAction(formData);

      if (!result.ok) {
        toast.error(result.message);
        return;
      }

      toast.success(result.message);

      if (
        "persisted" in result &&
        result.persisted &&
        "slug" in result &&
        typeof result.slug === "string"
      ) {
        router.push(`/dashboard/events/${result.slug}`);
        return;
      }

      form.reset();
      setTicketRows([newTicketRow()]);
      router.refresh();
    });
  }

  return (
    <form onSubmit={submit} className="space-y-5">
      <div className="grid gap-4 md:grid-cols-2">
        <Field label="Title"><Input name="title" required /></Field>
        <Field label="Slug"><Input name="slug" required placeholder="fcf-summer-conference" /></Field>
        <Field label="Starts"><Input name="startsAt" type="datetime-local" required /></Field>
        <Field label="Ends"><Input name="endsAt" type="datetime-local" required /></Field>
        <Field label="Venue"><Input name="venueName" /></Field>
        <Field label="Room"><Input name="room" /></Field>
        <Field label="Capacity"><Input name="capacity" type="number" min={1} /></Field>
        <Field label="Minimum age"><Input name="minimumAge" type="number" defaultValue={19} min={18} /></Field>
      </div>
      <Field label="Address"><Input name="address" /></Field>
      <Field label="Description"><Textarea name="description" /></Field>
      <Field label="Compliance notes"><Textarea name="complianceNotes" /></Field>
      <div className="grid gap-4 md:grid-cols-2">
        <Field label="Zeffy campaign ID"><Input name="zeffyCampaignId" placeholder="Optional after Zeffy form is created" /></Field>
        <Field label="Zeffy form URL"><Input name="zeffyFormUrl" type="url" placeholder="https://www.zeffy.com/..." /></Field>
      </div>
      <div className="grid gap-4 md:grid-cols-2">
        <Field label="Status">
          <SelectField name="status" options={statusOptions} />
        </Field>
        <Field label="Visibility">
          <SelectField name="visibility" options={eventVisibilityOptions} />
        </Field>
      </div>

      <section className="space-y-3 border-t border-white/10 pt-5">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <h4 className="text-sm font-semibold text-white">Ticket Types</h4>
          <Button type="button" size="sm" variant="secondary" onClick={addTicketRow} disabled={isPending}>
            <Plus className="h-4 w-4" aria-hidden />
            Add Ticket
          </Button>
        </div>

        {ticketRows.length ? (
          <div className="space-y-3">
            {ticketRows.map((row, index) => (
              <div key={row.key} className="rounded-md border border-white/10 p-4">
                <div className="flex items-center justify-between gap-3">
                  <p className="text-sm font-medium text-white">Ticket {index + 1}</p>
                  <Button
                    type="button"
                    size="icon"
                    variant="ghost"
                    aria-label={`Remove ticket ${index + 1}`}
                    onClick={() => removeTicketRow(row.key)}
                    disabled={isPending}
                  >
                    <Trash2 className="h-4 w-4" aria-hidden />
                  </Button>
                </div>
                <div className="mt-3 grid gap-3 md:grid-cols-2 xl:grid-cols-5">
                  <Field label="Name">
                    <Input name="ticketName" placeholder="General Admission" required />
                  </Field>
                  <Field label="Price">
                    <Input name="ticketPrice" type="number" min={0} step="0.01" placeholder="0" required />
                  </Field>
                  <Field label="Currency">
                    <Input name="ticketCurrency" defaultValue="CAD" maxLength={3} required />
                  </Field>
                  <Field label="Capacity">
                    <Input name="ticketCapacityLimit" type="number" min={1} />
                  </Field>
                  <Field label="Visibility">
                    <SelectField name="ticketVisibility" defaultValue="public" options={ticketVisibilityOptions} />
                  </Field>
                </div>
                <div className="mt-3">
                  <Field label="Description">
                    <Input name="ticketDescription" placeholder="Optional" />
                  </Field>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="rounded-md border border-dashed border-white/15 p-4 text-sm text-[#999999]">
            No ticket types added.
          </div>
        )}
      </section>

      <Button type="submit" disabled={isPending}>
        <CalendarPlus className="h-4 w-4" aria-hidden />
        {isPending ? "Creating" : "Create Event"}
      </Button>
    </form>
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

function newTicketRow(): TicketRow {
  return { key: crypto.randomUUID() };
}
