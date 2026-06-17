import { stat } from "fs/promises";
import path from "path";
import { Download, Smartphone } from "lucide-react";
import { PageHeader } from "@/components/page-header";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { requireDashboardAccess } from "@/lib/auth";

export const dynamic = "force-dynamic";

const apkPath = "/downloads/fcf-checkin.apk";
const apkReleasedAt = "2026-06-16T22:32:00-04:00";

export default async function AppDownloadPage() {
  await requireDashboardAccess(["owner", "admin"]);
  const apk = await getApkInfo();

  return (
    <>
      <PageHeader
        eyebrow="Admin tools"
        title="App Download"
        description="Download the Android admin check-in app for scanning tickets, manual lookup, and walk-up check-in."
      />

      <Card>
        <CardHeader>
          <div className="flex items-center gap-3">
            <span className="inline-flex h-10 w-10 items-center justify-center rounded-md bg-[#e50913]/15 text-[#ff6b6f]">
              <Smartphone className="h-5 w-5" aria-hidden />
            </span>
            <div>
              <CardTitle>FCF Check-in for Android</CardTitle>
              <p className="mt-1 text-sm text-[#999999]">APK for Samsung and other Android devices.</p>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-5">
          <div className="rounded-md border border-white/10 bg-white/[0.03] p-4">
            <p className="text-sm text-[#999999]">Download link</p>
            {apk.available ? (
              <a className="mt-2 block break-all font-mono text-sm text-white underline decoration-[#e50913] underline-offset-4" href={apkPath} download>
                {apkPath}
              </a>
            ) : (
              <p className="mt-2 text-sm text-red-200">APK has not been uploaded yet.</p>
            )}
          </div>

          <div className="grid gap-3 text-sm text-[#dddddd] md:grid-cols-3">
            <Info label="Version" value="1.0.0" />
            <Info label="File size" value={apk.available ? apk.size : "Pending"} />
            <Info label="Updated" value={apk.available ? apk.updatedAt : "Pending"} />
          </div>

          <Button asChild disabled={!apk.available}>
            <a href={apkPath} download>
              <Download className="h-4 w-4" aria-hidden />
              Download APK
            </a>
          </Button>
        </CardContent>
      </Card>
    </>
  );
}

async function getApkInfo() {
  try {
    const file = await stat(path.join(process.cwd(), "public", "downloads", "fcf-checkin.apk"));
    return {
      available: true,
      size: formatBytes(file.size),
      updatedAt: formatReleaseDate(apkReleasedAt),
    };
  } catch {
    return {
      available: false,
      size: "Pending",
      updatedAt: "Pending",
    };
  }
}

function Info({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-md border border-white/10 bg-[#0b0b0b] p-3">
      <p className="text-xs uppercase tracking-[0.12em] text-[#999999]">{label}</p>
      <p className="mt-1 font-medium text-white">{value}</p>
    </div>
  );
}

function formatBytes(bytes: number) {
  if (bytes < 1024 * 1024) return `${Math.round(bytes / 1024)} KB`;
  return `${(bytes / 1024 / 1024).toFixed(1)} MB`;
}

function formatReleaseDate(value: string) {
  return new Intl.DateTimeFormat("en-US", {
    dateStyle: "medium",
    timeStyle: "short",
    timeZone: "America/Toronto",
  }).format(new Date(value));
}
