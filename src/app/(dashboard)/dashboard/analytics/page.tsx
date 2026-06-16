import { DashboardCharts } from "@/components/charts/dashboard-charts";
import { MetricCard } from "@/components/metric-card";
import { PageHeader } from "@/components/page-header";
import { getAnalyticsData, getDashboardMetrics } from "@/lib/data";

export default async function AnalyticsPage() {
  const [metrics, analytics] = await Promise.all([getDashboardMetrics(), getAnalyticsData()]);

  return (
    <>
      <PageHeader eyebrow="Insights" title="Analytics" description="Registration, attendance, repeat attendee, ticket, session, company, discount, and SMS conversion views." />
      <div className="mb-4 grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <MetricCard label="Repeat attendee rate" value={`${metrics.repeatAttendeeRate}%`} />
        <MetricCard label="No-show rate" value={`${Math.max(0, 100 - metrics.checkInPercentage)}%`} />
        <MetricCard label="SMS consent rate" value={`${metrics.smsConsentRate}%`} />
        <MetricCard label="Capacity utilization" value="37%" />
      </div>
      <DashboardCharts registrationTrend={analytics.registrationTrend} ticketBreakdown={analytics.ticketBreakdown} />
    </>
  );
}

