"use client";

import { type FormEvent, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { Edit3, Plus, RotateCcw, Save, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { createDiscountCodeAction, removeDiscountCodeAction, updateDiscountCodeAction } from "@/lib/actions/discounts";
import type { DiscountCodeSummary, DiscountType, EventSummary, TicketTypeSummary } from "@/lib/types";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { SelectField } from "@/components/ui/select-field";
import { Textarea } from "@/components/ui/textarea";

type ScopeMode = "all" | "selected";

const typeOptions: Array<{ label: string; value: DiscountType }> = [
  { label: "Percentage", value: "percentage" },
  { label: "Fixed amount", value: "fixed_amount" },
  { label: "Comp", value: "comp" },
  { label: "Access-only", value: "access_only" },
];

const scopeOptions: Array<{ label: string; value: ScopeMode }> = [
  { label: "All", value: "all" },
  { label: "Selected", value: "selected" },
];

export function DiscountCodeManager({
  discounts,
  events,
  ticketTypes,
}: {
  discounts: DiscountCodeSummary[];
  events: EventSummary[];
  ticketTypes: TicketTypeSummary[];
}) {
  const router = useRouter();
  const [editing, setEditing] = useState<DiscountCodeSummary | null>(null);
  const [selectedType, setSelectedType] = useState<DiscountType>("percentage");
  const [eventScope, setEventScope] = useState<ScopeMode>("all");
  const [ticketScope, setTicketScope] = useState<ScopeMode>("all");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [removingId, setRemovingId] = useState<string | null>(null);

  const eventById = useMemo(() => new Map(events.map((event) => [event.id, event])), [events]);
  const ticketById = useMemo(() => new Map(ticketTypes.map((ticket) => [ticket.id, ticket])), [ticketTypes]);

  const ticketOptions = useMemo(
    () =>
      ticketTypes.map((ticket) => {
        const event = eventById.get(ticket.event_id);
        return {
          label: event ? `${ticket.name} - ${event.title}` : ticket.name,
          value: ticket.id,
        };
      }),
    [eventById, ticketTypes],
  );

  function startNewCode() {
    setEditing(null);
    setSelectedType("percentage");
    setEventScope("all");
    setTicketScope("all");
  }

  function startEditing(discount: DiscountCodeSummary) {
    setEditing(discount);
    setSelectedType(discount.type);
    setEventScope(discount.applies_to_event_ids.length ? "selected" : "all");
    setTicketScope(discount.applies_to_ticket_type_ids.length ? "selected" : "all");
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setIsSubmitting(true);

    const form = event.currentTarget;
    const formData = new FormData(form);
    const result = editing ? await updateDiscountCodeAction(formData) : await createDiscountCodeAction(formData);

    setIsSubmitting(false);

    if (!result.ok) {
      toast.error(result.message);
      return;
    }

    toast.success(result.message);
    if (!editing) form.reset();
    startNewCode();
    router.refresh();
  }

  async function handleRemove(discount: DiscountCodeSummary) {
    const confirmed = window.confirm(`Remove ${discount.code}?`);
    if (!confirmed) return;

    const formData = new FormData();
    formData.set("id", discount.id);
    setRemovingId(discount.id);
    const result = await removeDiscountCodeAction(formData);
    setRemovingId(null);

    if (!result.ok) {
      toast.error(result.message);
      return;
    }

    toast.success(result.message);
    if (editing?.id === discount.id) startNewCode();
    router.refresh();
  }

  return (
    <div className="grid gap-4 xl:grid-cols-[1fr_0.72fr]">
      <Card>
        <CardHeader>
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <CardTitle>Discount Codes</CardTitle>
            <Button type="button" size="sm" onClick={startNewCode}>
              <Plus className="h-4 w-4" aria-hidden />
              New Code
            </Button>
          </div>
        </CardHeader>
        <CardContent className="space-y-3">
          {discounts.length ? (
            discounts.map((discount) => (
              <div key={discount.id} className="rounded-md border border-white/10 p-4">
                <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <p className="font-mono text-sm font-semibold text-white">{discount.code}</p>
                      <Badge variant={discount.active ? "success" : "danger"}>
                        {discount.active ? "Active" : "Inactive"}
                      </Badge>
                      <Badge variant="muted">{typeLabel(discount.type)}</Badge>
                    </div>
                    <p className="mt-2 text-sm text-[#bbbbbb]">
                      {discount.description || formatDiscountValue(discount)}
                    </p>
                    <div className="mt-3 grid gap-2 text-xs text-[#999999] sm:grid-cols-2">
                      <span>{targetLabel(discount.applies_to_event_ids, eventById, "All events")}</span>
                      <span>{targetLabel(discount.applies_to_ticket_type_ids, ticketById, "All tickets")}</span>
                      <span>{usageLabel(discount)}</span>
                      <span>{expiryLabel(discount.expires_at)}</span>
                    </div>
                  </div>
                  <div className="flex shrink-0 gap-2">
                    <Button type="button" variant="outline" size="sm" onClick={() => startEditing(discount)}>
                      <Edit3 className="h-4 w-4" aria-hidden />
                      Edit
                    </Button>
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      disabled={removingId === discount.id}
                      onClick={() => handleRemove(discount)}
                    >
                      <Trash2 className="h-4 w-4" aria-hidden />
                      Remove
                    </Button>
                  </div>
                </div>
              </div>
            ))
          ) : (
            <div className="rounded-md border border-white/10 p-6 text-sm text-[#999999]">No discount codes yet.</div>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>{editing ? "Edit Discount" : "New Discount"}</CardTitle>
        </CardHeader>
        <CardContent>
          <form key={editing?.id ?? "new"} onSubmit={handleSubmit} className="space-y-4">
            <input type="hidden" name="id" value={editing?.id ?? ""} />
            <div className="grid gap-4 sm:grid-cols-2">
              <Field label="Code">
                <Input name="code" defaultValue={editing?.code ?? ""} required className="font-mono uppercase" />
              </Field>
              <Field label="Type">
                <SelectField
                  name="type"
                  value={selectedType}
                  onChange={(event) => setSelectedType(event.currentTarget.value as DiscountType)}
                  options={typeOptions}
                  required
                />
              </Field>
            </div>

            <Field label="Description">
              <Input name="description" defaultValue={editing?.description ?? ""} />
            </Field>

            <div className="grid gap-4 sm:grid-cols-2">
              <Field label="Amount">
                {selectedType === "comp" || selectedType === "access_only" ? (
                  <>
                    <input type="hidden" name="amount" value="0" />
                    <Input value="0" disabled />
                  </>
                ) : (
                  <Input
                    key={selectedType}
                    name="amount"
                    type="number"
                    min="0"
                    max={selectedType === "percentage" ? "100" : undefined}
                    step={selectedType === "percentage" ? "1" : "0.01"}
                    defaultValue={editing?.type === selectedType ? editing.amount : ""}
                    required
                  />
                )}
              </Field>
              <Field label="Status">
                <SelectField
                  name="active"
                  defaultValue={String(editing?.active ?? true)}
                  options={[
                    { label: "Active", value: "true" },
                    { label: "Inactive", value: "false" },
                  ]}
                  required
                />
              </Field>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <Field label="Event scope">
                <SelectField
                  value={eventScope}
                  onChange={(event) => setEventScope(event.currentTarget.value as ScopeMode)}
                  options={scopeOptions}
                />
              </Field>
              <Field label="Ticket scope">
                <SelectField
                  value={ticketScope}
                  onChange={(event) => setTicketScope(event.currentTarget.value as ScopeMode)}
                  options={scopeOptions}
                />
              </Field>
            </div>

            {eventScope === "selected" ? (
              <Field label="Events">
                <MultiSelect
                  name="appliesToEventIds"
                  options={events.map((event) => ({ label: event.title, value: event.id }))}
                  defaultValue={editing?.applies_to_event_ids ?? []}
                />
              </Field>
            ) : null}

            {ticketScope === "selected" ? (
              <Field label="Tickets">
                <MultiSelect
                  name="appliesToTicketTypeIds"
                  options={ticketOptions}
                  defaultValue={editing?.applies_to_ticket_type_ids ?? []}
                />
              </Field>
            ) : null}

            <div className="grid gap-4 sm:grid-cols-2">
              <Field label="Max uses">
                <Input name="maxTotalUses" type="number" min="1" defaultValue={editing?.max_total_uses ?? ""} />
              </Field>
              <Field label="Min quantity">
                <Input
                  name="minimumTicketQuantity"
                  type="number"
                  min="1"
                  defaultValue={editing?.minimum_ticket_quantity ?? 1}
                  required
                />
              </Field>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <Field label="Expires">
                <Input name="expiresAt" type="datetime-local" defaultValue={toDateTimeLocal(editing?.expires_at)} />
              </Field>
              <Field label="Per attendee">
                <SelectField
                  name="oneUsePerAttendee"
                  defaultValue={String(editing?.one_use_per_attendee ?? true)}
                  options={[
                    { label: "One use", value: "true" },
                    { label: "Multiple uses", value: "false" },
                  ]}
                  required
                />
              </Field>
            </div>

            <Field label="Internal notes">
              <Textarea name="internalNotes" defaultValue={editing?.internal_notes ?? ""} />
            </Field>

            <div className="flex flex-wrap gap-2">
              <Button type="submit" disabled={isSubmitting}>
                {editing ? <Save className="h-4 w-4" aria-hidden /> : <Plus className="h-4 w-4" aria-hidden />}
                {editing ? "Save Changes" : "Create Code"}
              </Button>
              <Button type="button" variant="outline" onClick={startNewCode} disabled={isSubmitting}>
                <RotateCcw className="h-4 w-4" aria-hidden />
                Reset
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
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

function MultiSelect({
  name,
  options,
  defaultValue,
}: {
  name: string;
  options: Array<{ label: string; value: string }>;
  defaultValue: string[];
}) {
  return (
    <select
      name={name}
      multiple
      size={Math.min(Math.max(options.length, 3), 5)}
      defaultValue={defaultValue}
      className="min-h-28 w-full rounded-md border border-white/10 bg-[#0b0b0b] px-3 py-2 text-sm text-white outline-none focus:border-[#e50913] focus:ring-2 focus:ring-[#e50913]/20"
    >
      {options.map((option) => (
        <option key={option.value} value={option.value}>
          {option.label}
        </option>
      ))}
    </select>
  );
}

function typeLabel(type: DiscountType) {
  return typeOptions.find((option) => option.value === type)?.label ?? type;
}

function formatDiscountValue(discount: DiscountCodeSummary) {
  if (discount.type === "percentage") return `${discount.amount}% off`;
  if (discount.type === "fixed_amount") return `$${discount.amount.toFixed(2)} off`;
  if (discount.type === "comp") return "Comped ticket";
  return "Access-only";
}

function targetLabel<T extends { id?: string; title?: string; name?: string }>(
  ids: string[],
  lookup: Map<string, T>,
  fallback: string,
) {
  if (!ids.length) return fallback;
  const labels = ids.map((id) => lookup.get(id)?.title ?? lookup.get(id)?.name ?? "Unknown").filter(Boolean);
  if (labels.length <= 2) return labels.join(", ");
  return `${labels.slice(0, 2).join(", ")} +${labels.length - 2}`;
}

function usageLabel(discount: DiscountCodeSummary) {
  if (!discount.max_total_uses) return `${discount.successful_redemptions} used`;
  return `${discount.successful_redemptions}/${discount.max_total_uses} used`;
}

function expiryLabel(value: string | null) {
  if (!value) return "No expiry";
  return `Expires ${new Date(value).toLocaleDateString()}`;
}

function toDateTimeLocal(value?: string | null) {
  if (!value) return "";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "";
  const offset = date.getTimezoneOffset() * 60000;
  return new Date(date.getTime() - offset).toISOString().slice(0, 16);
}
