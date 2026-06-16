import { PageHeader } from "@/components/page-header";
import { DiscountCodeManager } from "@/components/discount-code-manager";
import { requireDashboardAccess } from "@/lib/auth";
import { getDiscountCodes, getEvents, getTicketTypes } from "@/lib/data";

export default async function DiscountsPage() {
  await requireDashboardAccess(["owner", "admin", "manager"]);
  const [discounts, events, ticketTypes] = await Promise.all([getDiscountCodes(), getEvents(), getTicketTypes()]);

  return (
    <>
      <PageHeader
        eyebrow="Access"
        title="Discounts"
        description="Codes for discounted, comped, access-only, and private ticket workflows."
      />
      <DiscountCodeManager discounts={discounts} events={events} ticketTypes={ticketTypes} />
    </>
  );
}
