import Link from "next/link";
import { CalendarDays, Clock, MapPin } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import type { EventSummary } from "@/lib/types";

export function PublicEventCard({ event, mode = "upcoming" }: { event: EventSummary; mode?: "upcoming" | "past" }) {
  const start = new Date(event.starts_at);
  const isPast = mode === "past";

  return (
    <Card className="overflow-hidden">
      <CardContent className="p-0">
        <div className="grid gap-0 md:grid-cols-[180px_1fr]">
          <div className={`flex flex-col justify-between p-5 ${isPast ? "bg-[#2a2a2a]" : "bg-[#b20711]"}`}>
            <div>
              <p className="text-sm uppercase text-white/75">{start.toLocaleString("en-CA", { month: "short" })}</p>
              <p className="mt-1 text-5xl font-semibold">{start.getDate()}</p>
            </div>
            <p className="mt-6 text-sm text-white/80">{start.toLocaleString("en-CA", { weekday: "long" })}</p>
          </div>
          <div className="p-5 md:p-6">
            <div className="flex min-w-0 flex-col gap-3 md:flex-row md:items-start md:justify-between">
              <div className="min-w-0">
                <Badge variant="muted">{event.event_category ?? "Conference"}</Badge>
                <h2 className="mt-3 text-xl font-semibold leading-snug text-white sm:text-2xl">{event.title}</h2>
              </div>
              <Badge variant={isPast ? "muted" : "success"}>{isPast ? "Past" : `${event.minimum_age}+`}</Badge>
            </div>
            <p className="mt-4 text-sm leading-6 text-[#bbbbbb]">{event.description}</p>
            <div className="mt-5 grid gap-3 text-sm text-[#dddddd] md:grid-cols-2">
              <span className="flex items-center gap-2">
                <Clock className="h-4 w-4 text-[#e50913]" aria-hidden />
                {start.toLocaleTimeString("en-CA", { hour: "numeric", minute: "2-digit" })}
              </span>
              <span className="flex items-center gap-2">
                <MapPin className="h-4 w-4 text-[#e50913]" aria-hidden />
                {event.venue_name ?? "Venue TBA"}
              </span>
              <span className="flex items-center gap-2 md:col-span-2">
                <CalendarDays className="h-4 w-4 text-[#e50913]" aria-hidden />
                {start.toLocaleDateString("en-CA", {
                  weekday: "long",
                  month: "long",
                  day: "numeric",
                  year: "numeric",
                })}
              </span>
            </div>
            <div className="mt-6 flex flex-col gap-3 sm:flex-row">
              {!isPast ? (
                <Button asChild size="lg" className="w-full sm:w-auto">
                  <Link href={`/e/${event.slug}`}>Sign up for this event</Link>
                </Button>
              ) : null}
              <Button asChild variant="outline" size="lg" className="w-full sm:w-auto">
                <Link href={`/e/${event.slug}`}>View details</Link>
              </Button>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
