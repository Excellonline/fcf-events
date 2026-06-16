import Link from "next/link";
import { EventCreateForm } from "@/components/event-create-form";
import { PageHeader } from "@/components/page-header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { getEvents } from "@/lib/data";

export default async function EventsPage() {
  const events = await getEvents();

  return (
    <>
      <PageHeader
        eyebrow="Programming"
        title="Events"
        description="Create, publish, and manage conferences, seminars, networking nights, and private events."
      />
      <div className="grid gap-4 xl:grid-cols-[1fr_0.85fr]">
        <Card>
          <CardHeader>
            <CardTitle>Event List</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {events.map((event) => (
              <Link key={event.id} href={`/dashboard/events/${event.slug}`} className="block rounded-md border border-white/10 p-4 transition hover:bg-white/5">
                <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
                  <div>
                    <p className="font-medium text-white">{event.title}</p>
                    <p className="mt-1 text-sm text-[#999999]">{new Date(event.starts_at).toLocaleString()} - {event.venue_name}</p>
                  </div>
                  <div className="flex gap-2">
                    <Badge variant={event.status === "published" ? "success" : "muted"}>{event.status}</Badge>
                    <Badge variant="muted">{event.visibility}</Badge>
                  </div>
                </div>
              </Link>
            ))}
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>New Event</CardTitle>
          </CardHeader>
          <CardContent>
            <EventCreateForm />
          </CardContent>
        </Card>
      </div>
    </>
  );
}
