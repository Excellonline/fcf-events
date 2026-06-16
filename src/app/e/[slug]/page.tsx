import { notFound } from "next/navigation";
import { CalendarDays, MapPin, ShieldCheck, Ticket } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { RegistrationForm } from "@/components/registration-form";
import { getEventBySlug, getSessions, getTicketTypes } from "@/lib/data";

export default async function PublicEventPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const event = await getEventBySlug(slug);
  if (!event || event.status !== "published") notFound();

  const [sessions, ticketTypes] = await Promise.all([getSessions(event.id), getTicketTypes(event.id)]);

  return (
    <main className="min-h-screen bg-[#0b0b0b] text-white">
      <section className="border-b border-white/10">
        <div className="mx-auto grid max-w-7xl gap-8 px-4 py-8 md:grid-cols-[1fr_0.8fr] md:px-8 md:py-12">
          <div>
            <Badge className="mb-4">FCF Events</Badge>
            <h1 className="text-4xl font-semibold leading-tight md:text-6xl">{event.title}</h1>
            <p className="mt-5 max-w-3xl text-base leading-7 text-[#dddddd]">{event.description}</p>
            <div className="mt-8 grid gap-3 md:grid-cols-2">
              <Info icon={CalendarDays} label="Date" value={new Date(event.starts_at).toLocaleString()} />
              <Info icon={MapPin} label="Venue" value={`${event.venue_name ?? ""} ${event.address ?? ""}`} />
              <Info icon={Ticket} label="Capacity" value={event.capacity ? `${event.capacity} guests` : "Limited capacity"} />
              <Info icon={ShieldCheck} label="Age requirement" value={`${event.minimum_age}+`} />
            </div>
            <Card className="mt-6">
              <CardHeader>
                <CardTitle>Compliance Note</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm leading-6 text-[#999999]">{event.compliance_notes}</p>
              </CardContent>
            </Card>
          </div>
          <RegistrationForm event={event} ticketTypes={ticketTypes} sessions={sessions} />
        </div>
      </section>
      <section className="mx-auto max-w-7xl px-4 py-8 md:px-8">
        <h2 className="text-2xl font-semibold">Agenda</h2>
        <div className="mt-4 grid gap-3 md:grid-cols-2">
          {sessions.map((session) => (
            <Card key={session.id}>
              <CardContent className="p-5">
                <Badge variant="muted">{session.type}</Badge>
                <h3 className="mt-4 text-lg font-semibold">{session.title}</h3>
                <p className="mt-2 text-sm text-[#999999]">{new Date(session.starts_at).toLocaleTimeString()} · {session.room}</p>
              </CardContent>
            </Card>
          ))}
        </div>
      </section>
    </main>
  );
}

function Info({
  icon: Icon,
  label,
  value,
}: {
  icon: React.ComponentType<{ className?: string; "aria-hidden"?: boolean }>;
  label: string;
  value: string;
}) {
  return (
    <div className="rounded-md border border-white/10 bg-[#111111] p-4">
      <Icon className="h-5 w-5 text-[#e50913]" aria-hidden />
      <p className="mt-3 text-sm text-[#999999]">{label}</p>
      <p className="mt-1 text-sm font-medium text-white">{value}</p>
    </div>
  );
}

