import { PageHeader } from "@/components/page-header";
import { CheckInScanner } from "@/components/check-in-scanner";
import { getEvents, getSessions } from "@/lib/data";

export default async function DashboardCheckInPage() {
  const [events, sessions] = await Promise.all([getEvents(), getSessions()]);

  return (
    <>
      <PageHeader eyebrow="Staff Mode" title="Check-in" description="Scan QR codes, enter ticket codes manually, or switch between event and session check-in." />
      <CheckInScanner events={events} sessions={sessions} />
    </>
  );
}

