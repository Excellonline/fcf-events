import Link from "next/link";
import {
  Activity,
  AirVent,
  BarChart3,
  CalendarDays,
  CheckCircle2,
  ClipboardList,
  ContactRound,
  LayoutDashboard,
  MessageSquare,
  Percent,
  Settings,
  ShieldCheck,
  Ticket,
} from "lucide-react";
import { cn } from "@/lib/utils";

const nav = [
  { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/dashboard/events", label: "Events", icon: CalendarDays },
  { href: "/dashboard/sessions", label: "Sessions", icon: ClipboardList },
  { href: "/dashboard/attendees", label: "Attendees", icon: ContactRound },
  { href: "/dashboard/analytics", label: "Analytics", icon: BarChart3 },
  { href: "/dashboard/communications", label: "Communications", icon: MessageSquare },
  { href: "/dashboard/discounts", label: "Discounts", icon: Percent },
  { href: "/dashboard/settings", label: "Settings", icon: Settings },
  { href: "/dashboard/check-in", label: "Check-in", icon: CheckCircle2 },
  { href: "/dashboard/airtable-sync", label: "Airtable Sync", icon: AirVent },
  { href: "/dashboard/audit-logs", label: "Audit Logs", icon: ShieldCheck },
];

export function AppShell({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-[#0b0b0b] text-white">
      <aside className="fixed inset-y-0 left-0 z-20 hidden w-72 border-r border-white/10 bg-[#0f0f0f] p-4 lg:block">
        <Link href="/dashboard" className="mb-8 flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-md bg-[#b20711]">
            <Ticket className="h-5 w-5" aria-hidden />
          </div>
          <div>
            <p className="text-sm font-semibold">FCF Events</p>
            <p className="text-xs text-[#999999]">Organizer console</p>
          </div>
        </Link>
        <nav className="space-y-1">
          {nav.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex items-center gap-3 rounded-md px-3 py-2 text-sm text-[#dddddd] transition hover:bg-white/10 hover:text-white",
              )}
            >
              <item.icon className="h-4 w-4" aria-hidden />
              {item.label}
            </Link>
          ))}
        </nav>
      </aside>
      <div className="lg:pl-72">
        <header className="sticky top-0 z-10 border-b border-white/10 bg-[#0b0b0b]/90 px-4 py-3 backdrop-blur lg:px-8">
          <div className="flex items-center justify-between gap-4">
            <Link href="/dashboard" className="flex items-center gap-2 lg:hidden">
              <Ticket className="h-5 w-5 text-[#e50913]" aria-hidden />
              <span className="text-sm font-semibold">FCF Events</span>
            </Link>
            <div className="hidden text-sm text-[#999999] lg:block">Private event operations platform</div>
            <div className="flex items-center gap-2 text-xs text-[#999999]">
              <Activity className="h-4 w-4 text-emerald-300" aria-hidden />
              Demo-safe mode
            </div>
          </div>
        </header>
        <main className="px-4 py-6 lg:px-8">{children}</main>
      </div>
    </div>
  );
}

