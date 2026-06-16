import { CheckInScanner } from "@/components/check-in-scanner";
import { PageHeader } from "@/components/page-header";
import { getEvents, getSessions } from "@/lib/data";

export default async function PublicCheckInPage() {
  const [events, sessions] = await Promise.all([getEvents(), getSessions()]);

  return (
    <main className="min-h-screen bg-[#0b0b0b] px-4 py-6 text-white md:px-8">
      <PageHeader eyebrow="FCF Staff" title="Check-in Mode" description="Camera-first check-in for tablets, phones, and laptops." />
      <CheckInScanner events={events} sessions={sessions} />
    </main>
  );
}

