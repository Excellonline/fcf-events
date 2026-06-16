import Link from "next/link";
import { ArrowRight, CalendarDays, CheckCircle2, MessageSquare, ShieldCheck } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { getEvents } from "@/lib/data";
import { Badge } from "@/components/ui/badge";

export default async function Home() {
  const events = await getEvents();
  const publishedEvent = events.find((event) => event.status === "published") ?? events[0];

  return (
    <main className="min-h-screen bg-[#0b0b0b] text-white">
      <section className="border-b border-white/10">
        <div className="mx-auto grid min-h-[92vh] max-w-7xl content-center gap-10 px-4 py-10 md:grid-cols-[1.1fr_0.9fr] md:px-8">
          <div className="flex flex-col justify-center">
            <Badge className="mb-4 w-fit">Private cannabis event operations</Badge>
            <h1 className="max-w-4xl text-4xl font-semibold leading-tight md:text-6xl">FCF Events</h1>
            <p className="mt-5 max-w-2xl text-base leading-7 text-[#dddddd] md:text-lg">
              Ticketing, QR check-in, attendee CRM, repeat tracking, and SMS reminders for professional Canadian cannabis events.
            </p>
            <div className="mt-8 flex flex-col gap-3 sm:flex-row">
              <Button asChild size="lg">
                <Link href="/dashboard">
                  Open Dashboard
                  <ArrowRight className="h-4 w-4" aria-hidden />
                </Link>
              </Button>
              {publishedEvent ? (
                <Button asChild variant="outline" size="lg">
                  <Link href={`/e/${publishedEvent.slug}`}>View Event Page</Link>
                </Button>
              ) : null}
            </div>
          </div>
          <div className="grid content-center gap-4">
            {[
              { title: "Secure QR check-in", icon: CheckCircle2, text: "Atomic database check-ins prevent duplicate entry." },
              { title: "SMS reminders", icon: MessageSquare, text: "Consent-aware reminders with logs and opt-out handling." },
              { title: "Session programming", icon: CalendarDays, text: "Event-level and session-level registration and attendance." },
              { title: "Compliance support", icon: ShieldCheck, text: "Age gates, audit logs, privacy workflows, and safer copy defaults." },
            ].map((item) => (
              <Card key={item.title}>
                <CardHeader className="flex flex-row items-center gap-3 space-y-0">
                  <item.icon className="h-5 w-5 text-[#e50913]" aria-hidden />
                  <CardTitle>{item.title}</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-sm leading-6 text-[#999999]">{item.text}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>
    </main>
  );
}

