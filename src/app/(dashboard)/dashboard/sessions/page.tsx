import { PageHeader } from "@/components/page-header";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { getEvents, getSessions } from "@/lib/data";

export default async function SessionsPage() {
  const [events, sessions] = await Promise.all([getEvents(), getSessions()]);

  return (
    <>
      <PageHeader eyebrow="Agenda" title="Sessions" description="Concurrent seminars, panels, workshops, and networking blocks across events." />
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {sessions.map((session) => {
          const event = events.find((item) => item.id === session.event_id);
          return (
            <Card key={session.id}>
              <CardContent className="p-5">
                <Badge>{session.type}</Badge>
                <h2 className="mt-4 text-lg font-semibold text-white">{session.title}</h2>
                <p className="mt-2 text-sm text-[#999999]">{event?.title}</p>
                <p className="mt-3 text-sm text-[#dddddd]">{new Date(session.starts_at).toLocaleString()} · {session.room}</p>
                <p className="mt-2 text-sm text-[#999999]">Capacity: {session.capacity ?? "Unlimited"}</p>
              </CardContent>
            </Card>
          );
        })}
      </div>
    </>
  );
}

