import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { PublicEventCard } from "@/components/public-event-card";
import { PublicFooter } from "@/components/public-footer";
import { PublicHeader } from "@/components/public-header";
import { getEvents } from "@/lib/data";

export default async function PastEventsPage() {
  const events = await getEvents();
  const now = new Date();
  const pastEvents = events
    .filter((event) => event.status === "published" && event.visibility !== "private" && new Date(event.ends_at) < now)
    .sort((a, b) => new Date(b.starts_at).getTime() - new Date(a.starts_at).getTime());

  return (
    <main className="min-h-screen bg-[#0b0b0b] text-white">
      <PublicHeader signupHref="/#events" />
      <section className="mx-auto max-w-7xl px-4 py-10 md:px-8 md:py-14">
        <div className="flex min-w-0 flex-col gap-6 md:flex-row md:items-end md:justify-between">
          <div className="min-w-0">
            <Badge className="mb-4 w-fit">Past events</Badge>
            <h1 className="text-3xl font-semibold leading-tight sm:text-4xl md:text-6xl">FCF Event Archive</h1>
            <p className="mt-5 max-w-2xl text-base leading-7 text-[#dddddd]">
              Browse previous FCF conferences, seminars, and networking events.
            </p>
          </div>
          <Button asChild variant="outline" className="w-full md:w-auto">
            <Link href="/#events">
              <ArrowLeft className="h-4 w-4" aria-hidden />
              Upcoming events
            </Link>
          </Button>
        </div>

        <div className="mt-8 grid min-w-0 gap-4">
          {pastEvents.length ? (
            pastEvents.map((event) => <PublicEventCard key={event.id} event={event} mode="past" />)
          ) : (
            <div className="rounded-lg border border-white/10 bg-[#111111] p-6">
              <h2 className="text-xl font-semibold text-white">No past events yet</h2>
              <p className="mt-2 text-sm leading-6 text-[#999999]">Upcoming events will remain on the home page until they end.</p>
            </div>
          )}
        </div>
      </section>
      <PublicFooter />
    </main>
  );
}
