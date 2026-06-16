import { PageHeader } from "@/components/page-header";
import { CheckInScanner } from "@/components/check-in-scanner";
import { getEvents, getSessions, getTicketTypes } from "@/lib/data";

export default async function DashboardCheckInPage() {
  const [events, sessions, ticketTypes] = await Promise.all([getEvents(), getSessions(), getTicketTypes()]);

  return (
    <>
      <PageHeader eyebrow="Staff Mode" title="Check-in" description="Scan QR codes first, then fall back to ticket codes, guest lookup, or walk-up entry." />
      <CheckInScanner events={events} sessions={sessions} ticketTypes={ticketTypes} />
    </>
  );
}
