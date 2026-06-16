import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { isSupabaseConfigured } from "@/lib/env";

export default function LoginPage() {
  const configured = isSupabaseConfigured();

  return (
    <main className="flex min-h-screen items-center justify-center bg-[#0b0b0b] px-4 text-white">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle>Organizer Login</CardTitle>
          <CardDescription>Use Supabase Auth in production. Demo mode lets you open the dashboard.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label>Email</Label>
            <Input type="email" placeholder="owner@example.com" disabled={!configured} />
          </div>
          <div className="space-y-2">
            <Label>Password</Label>
            <Input type="password" placeholder="••••••••" disabled={!configured} />
          </div>
          <Button className="w-full" disabled={!configured}>
            Sign In
          </Button>
          {!configured ? (
            <Button asChild variant="outline" className="w-full">
              <Link href="/dashboard">Continue in Demo Mode</Link>
            </Button>
          ) : null}
        </CardContent>
      </Card>
    </main>
  );
}

