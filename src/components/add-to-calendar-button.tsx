"use client";

import * as DropdownMenu from "@radix-ui/react-dropdown-menu";
import { CalendarPlus, ChevronDown, Download, ExternalLink } from "lucide-react";
import { Button, type ButtonProps } from "@/components/ui/button";

type AddToCalendarButtonProps = {
  title: string;
  startsAt: string;
  endsAt: string;
  location?: string | null;
  description?: string | null;
  url?: string | null;
  fileName?: string;
  className?: string;
  variant?: ButtonProps["variant"];
  size?: ButtonProps["size"];
};

export function AddToCalendarButton({
  title,
  startsAt,
  endsAt,
  location,
  description,
  url,
  fileName,
  className,
  variant = "outline",
  size,
}: AddToCalendarButtonProps) {
  function getCalendarDetails() {
    const eventUrl = url ?? window.location.href;

    return {
      title,
      startsAt,
      endsAt,
      location,
      description,
      url: eventUrl,
    };
  }

  function openCalendarProvider(provider: "google" | "outlook") {
    const details = getCalendarDetails();
    const providerUrl = provider === "google" ? googleCalendarUrl(details) : outlookCalendarUrl(details);
    window.open(providerUrl, "_blank", "noopener,noreferrer");
  }

  function downloadCalendarFile() {
    const content = buildCalendarFile(getCalendarDetails());
    const blob = new Blob([content], { type: "text/calendar;charset=utf-8" });
    const objectUrl = URL.createObjectURL(blob);
    const link = document.createElement("a");

    link.href = objectUrl;
    link.download = fileName ?? `${toSafeFileName(title)}.ics`;
    document.body.appendChild(link);
    link.click();
    link.remove();
    window.setTimeout(() => URL.revokeObjectURL(objectUrl), 1000);
  }

  return (
    <DropdownMenu.Root>
      <DropdownMenu.Trigger asChild>
        <Button type="button" variant={variant} size={size} className={className}>
          <CalendarPlus className="h-4 w-4" aria-hidden />
          Add to Calendar
          <ChevronDown className="h-3.5 w-3.5" aria-hidden />
        </Button>
      </DropdownMenu.Trigger>
      <DropdownMenu.Portal>
        <DropdownMenu.Content
          align="start"
          sideOffset={8}
          className="z-50 min-w-[220px] overflow-hidden rounded-md border border-white/15 bg-[#111111] p-1 text-white shadow-xl shadow-black/30"
        >
          <DropdownMenu.Item asChild>
            <button type="button" className={calendarMenuItemClass} onClick={() => openCalendarProvider("google")}>
              <ExternalLink className="h-4 w-4" aria-hidden />
              Google Calendar
            </button>
          </DropdownMenu.Item>
          <DropdownMenu.Item asChild>
            <button type="button" className={calendarMenuItemClass} onClick={() => openCalendarProvider("outlook")}>
              <ExternalLink className="h-4 w-4" aria-hidden />
              Outlook / Microsoft 365
            </button>
          </DropdownMenu.Item>
          <DropdownMenu.Separator className="my-1 h-px bg-white/10" />
          <DropdownMenu.Item asChild>
            <button type="button" className={calendarMenuItemClass} onClick={downloadCalendarFile}>
              <Download className="h-4 w-4" aria-hidden />
              Apple / other (.ics)
            </button>
          </DropdownMenu.Item>
        </DropdownMenu.Content>
      </DropdownMenu.Portal>
    </DropdownMenu.Root>
  );
}

const calendarMenuItemClass =
  "flex w-full cursor-pointer items-center gap-2 rounded px-3 py-2 text-left text-sm text-[#eeeeee] outline-none transition-colors hover:bg-white/10 focus:bg-white/10 data-[highlighted]:bg-white/10";

function buildCalendarFile({
  title,
  startsAt,
  endsAt,
  location,
  description,
  url,
}: {
  title: string;
  startsAt: string;
  endsAt: string;
  location?: string | null;
  description?: string | null;
  url: string;
}) {
  const details = [description, url].filter(Boolean).join("\n\n");
  const uid = `${toSafeFileName(title)}-${formatCalendarDate(startsAt)}@fcf.events`;
  const lines = [
    "BEGIN:VCALENDAR",
    "VERSION:2.0",
    "PRODID:-//FCF Events//Event Calendar//EN",
    "CALSCALE:GREGORIAN",
    "METHOD:PUBLISH",
    "BEGIN:VEVENT",
    `UID:${uid}`,
    `DTSTAMP:${formatCalendarDate(new Date().toISOString())}`,
    `DTSTART:${formatCalendarDate(startsAt)}`,
    `DTEND:${formatCalendarDate(endsAt)}`,
    `SUMMARY:${escapeCalendarText(title)}`,
    `DESCRIPTION:${escapeCalendarText(details)}`,
    `LOCATION:${escapeCalendarText(location ?? "")}`,
    `URL:${escapeCalendarText(url)}`,
    "END:VEVENT",
    "END:VCALENDAR",
  ];

  return `${lines.flatMap(foldCalendarLine).join("\r\n")}\r\n`;
}

function googleCalendarUrl(input: {
  title: string;
  startsAt: string;
  endsAt: string;
  location?: string | null;
  description?: string | null;
  url: string;
}) {
  const details = [input.description, input.url].filter(Boolean).join("\n\n");
  const url = new URL("https://calendar.google.com/calendar/render");

  url.searchParams.set("action", "TEMPLATE");
  url.searchParams.set("text", input.title);
  url.searchParams.set("dates", `${formatCalendarDate(input.startsAt)}/${formatCalendarDate(input.endsAt)}`);
  if (details) url.searchParams.set("details", details);
  if (input.location) url.searchParams.set("location", input.location);

  return url.toString();
}

function outlookCalendarUrl(input: {
  title: string;
  startsAt: string;
  endsAt: string;
  location?: string | null;
  description?: string | null;
  url: string;
}) {
  const body = [input.description, input.url].filter(Boolean).join("\n\n");
  const url = new URL("https://outlook.office.com/calendar/0/deeplink/compose");

  url.searchParams.set("path", "/calendar/action/compose");
  url.searchParams.set("rru", "addevent");
  url.searchParams.set("subject", input.title);
  url.searchParams.set("startdt", new Date(input.startsAt).toISOString());
  url.searchParams.set("enddt", new Date(input.endsAt).toISOString());
  if (body) url.searchParams.set("body", body);
  if (input.location) url.searchParams.set("location", input.location);

  return url.toString();
}

function formatCalendarDate(value: string) {
  return new Date(value).toISOString().replace(/[-:]/g, "").replace(/\.\d{3}Z$/, "Z");
}

function escapeCalendarText(value: string) {
  return value
    .replace(/\\/g, "\\\\")
    .replace(/\r?\n/g, "\\n")
    .replace(/,/g, "\\,")
    .replace(/;/g, "\\;");
}

function foldCalendarLine(line: string) {
  const folded: string[] = [];
  let remaining = line;

  while (remaining.length > 75) {
    folded.push(remaining.slice(0, 75));
    remaining = ` ${remaining.slice(75)}`;
  }

  folded.push(remaining);
  return folded;
}

function toSafeFileName(value: string) {
  const slug = value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 80);

  return slug || "fcf-event";
}
