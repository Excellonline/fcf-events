import { AppShell } from "@/components/app-shell";
import { CHECK_IN_ONLY_ROLES, requireDashboardAccess } from "@/lib/auth";
import { headers } from "next/headers";
import { redirect } from "next/navigation";

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  const access = await requireDashboardAccess();
  const pathname = (await headers()).get("x-pathname") ?? "";

  if (access.role && CHECK_IN_ONLY_ROLES.includes(access.role) && pathname !== "/dashboard/check-in") {
    redirect("/dashboard/check-in");
  }

  return (
    <AppShell currentEmail={access.email} currentRole={access.role}>
      {children}
    </AppShell>
  );
}
