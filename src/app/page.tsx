import Link from "next/link";
import { Button } from "@/components/ui/button";
import { getEvents } from "@/lib/data";
import { Badge } from "@/components/ui/badge";
import { PublicFooter } from "@/components/public-footer";
import { PublicHeader } from "@/components/public-header";
import { PublicEventCard } from "@/components/public-event-card";

export default async function Home() {
  const events = await getEvents();
  const now = new Date();
  const publicEvents = events.filter((event) => event.status === "published" && event.visibility !== "private");
  const upcomingEvents = publicEvents
    .filter((event) => new Date(event.ends_at) >= now)
    .sort((a, b) => new Date(a.starts_at).getTime() - new Date(b.starts_at).getTime());
  const pastEvents = publicEvents
    .filter((event) => new Date(event.ends_at) < now)
    .sort((a, b) => new Date(b.starts_at).getTime() - new Date(a.starts_at).getTime());
  const signupHref = upcomingEvents[0] ? `/e/${upcomingEvents[0].slug}` : "#events";

  return (
    <main className="min-h-screen bg-[#0b0b0b] text-white">
      <PublicHeader signupHref={signupHref} />

      <section id="events" className="mx-auto max-w-7xl px-4 py-10 md:px-8 md:py-14">
        <div className="grid min-w-0 gap-8 lg:grid-cols-[0.65fr_1fr]">
          <div className="min-w-0">
            <Badge className="mb-4 w-fit">Upcoming events</Badge>
            <h1 className="text-3xl font-semibold leading-tight sm:text-4xl md:text-6xl">Register for FCF Events</h1>
            <p className="mt-5 max-w-xl text-base leading-7 text-[#dddddd]">
              Browse upcoming FCF conferences, seminars, and networking events. Choose an event, sign up, and bring your QR ticket to check in.
            </p>
            <div className="mt-6 flex flex-wrap gap-3 text-sm text-[#999999]">
              <span className="rounded-md border border-white/10 px-3 py-2">Digital tickets</span>
              <span className="rounded-md border border-white/10 px-3 py-2">QR check-in</span>
              <span className="rounded-md border border-white/10 px-3 py-2">SMS reminders</span>
            </div>
            {pastEvents.length ? (
              <Button asChild variant="outline" className="mt-6 w-full sm:w-auto">
                <Link href="/past-events">View past events</Link>
              </Button>
            ) : null}
          </div>

          <div className="grid min-w-0 gap-4">
            {upcomingEvents.length ? (
              upcomingEvents.map((event) => <PublicEventCard key={event.id} event={event} />)
            ) : (
              <div className="rounded-lg border border-white/10 bg-[#111111] p-6">
                <Badge variant="muted">No upcoming events</Badge>
                <h2 className="mt-4 text-xl font-semibold text-white">Check back soon</h2>
                <p className="mt-2 text-sm leading-6 text-[#999999]">
                  New FCF events will appear here, and previous events are available in the archive.
                </p>
                <div className="mt-5 flex flex-col gap-3 sm:flex-row">
                  {pastEvents.length ? (
                    <Button asChild variant="outline" className="w-full sm:w-auto">
                      <Link href="/past-events">View past events</Link>
                    </Button>
                  ) : null}
                  <Button asChild className="w-full sm:w-auto" variant={pastEvents.length ? "ghost" : "outline"}>
                    <Link href="/login">Log in</Link>
                  </Button>
                </div>
              </div>
            )}
          </div>
        </div>
      </section>
      <PublicFooter />
    </main>
  );
}
