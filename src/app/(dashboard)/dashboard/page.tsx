import Link from "next/link";
import { ArrowRight, ScanLine, Send } from "lucide-react";
import { MetricCard } from "@/components/metric-card";
import { PageHeader } from "@/components/page-header";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { getDashboardMetrics, getEvents } from "@/lib/data";

export default async function DashboardPage() {
  const [metrics, events] = await Promise.all([getDashboardMetrics(), getEvents()]);
  const upcoming = events.slice(0, 3);

  return (
    <>
      <PageHeader
        eyebrow="Operations"
        title="Dashboard"
        description="A real-time command center for registrations, check-ins, reminders, and repeat attendee activity."
        action={
          <div className="flex gap-2">
            <Button asChild variant="outline">
              <Link href="/dashboard/check-in">
                <ScanLine className="h-4 w-4" aria-hidden />
                Check-in
              </Link>
            </Button>
            <Button asChild>
              <Link href="/dashboard/communications">
                <Send className="h-4 w-4" aria-hidden />
                Send Reminder
              </Link>
            </Button>
          </div>
        }
      />
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <MetricCard label="Upcoming events" value={metrics.upcomingEvents} />
        <MetricCard label="Registered" value={metrics.totalRegistered} />
        <MetricCard label="Checked in" value={metrics.totalCheckedIn} detail={`${metrics.checkInPercentage}% check-in rate`} />
        <MetricCard label="SMS consent" value={`${metrics.smsConsentRate}%`} detail={`${metrics.smsDelivered} delivered · ${metrics.smsFailed} failed`} />
      </div>
      <div className="mt-6 grid gap-4 lg:grid-cols-[1fr_0.7fr]">
        <Card>
          <CardHeader>
            <CardTitle>Upcoming Events</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {upcoming.map((event) => (
              <Link
                key={event.id}
                href={`/dashboard/events/${event.slug}`}
                className="flex items-center justify-between rounded-md border border-white/10 p-4 transition hover:bg-white/5"
              >
                <div>
                  <p className="font-medium text-white">{event.title}</p>
                  <p className="mt-1 text-sm text-[#999999]">{new Date(event.starts_at).toLocaleString()} · {event.venue_name}</p>
                </div>
                <Badge variant={event.status === "published" ? "success" : "muted"}>{event.status}</Badge>
              </Link>
            ))}
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Upcoming Reminders</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {["48h before event", "24h before event", "3h before doors"].map((item) => (
              <div key={item} className="flex items-center justify-between rounded-md border border-white/10 p-4">
                <span className="text-sm text-[#dddddd]">{item}</span>
                <ArrowRight className="h-4 w-4 text-[#666666]" aria-hidden />
              </div>
            ))}
          </CardContent>
        </Card>
      </div>
    </>
  );
}

