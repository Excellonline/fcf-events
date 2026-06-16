"use client";

import { useEffect, useId, useState, useTransition } from "react";
import { Camera, Keyboard, Search } from "lucide-react";
import { Html5Qrcode } from "html5-qrcode";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { SelectField } from "@/components/ui/select-field";
import { runCheckIn } from "@/lib/actions/check-in";
import type { CheckInResult, EventSummary, SessionSummary } from "@/lib/types";

export function CheckInScanner({ events, sessions }: { events: EventSummary[]; sessions: SessionSummary[] }) {
  const scannerId = useId().replaceAll(":", "");
  const [eventId, setEventId] = useState(events[0]?.id ?? "");
  const [sessionId, setSessionId] = useState("");
  const [ticketCode, setTicketCode] = useState("");
  const [cameraActive, setCameraActive] = useState(false);
  const [result, setResult] = useState<CheckInResult | null>(null);
  const [isPending, startTransition] = useTransition();

  const filteredSessions = sessions.filter((session) => session.event_id === eventId);

  useEffect(() => {
    if (!cameraActive) return;
    const scanner = new Html5Qrcode(scannerId);
    let mounted = true;

    scanner
      .start(
        { facingMode: "environment" },
        { fps: 10, qrbox: { width: 260, height: 260 } },
        (decodedText) => {
          if (!mounted) return;
          setTicketCode(decodedText.split("/").pop() ?? decodedText);
          setCameraActive(false);
        },
        () => undefined,
      )
      .catch(() => setCameraActive(false));

    return () => {
      mounted = false;
      scanner.stop().catch(() => undefined);
    };
  }, [cameraActive, scannerId]);

  function submit(code = ticketCode) {
    startTransition(async () => {
      const response = await runCheckIn({
        eventId,
        sessionId: sessionId || null,
        ticketCode: code.trim(),
      });
      setResult(response);
    });
  }

  return (
    <div className="grid gap-4 lg:grid-cols-[1fr_0.8fr]">
      <Card>
        <CardHeader>
          <CardTitle>Scan Ticket</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-3 md:grid-cols-2">
            <div className="space-y-2">
              <Label>Event</Label>
              <SelectField
                value={eventId}
                onChange={(event) => setEventId(event.target.value)}
                options={events.map((event) => ({ label: event.title, value: event.id }))}
              />
            </div>
            <div className="space-y-2">
              <Label>Session</Label>
              <SelectField
                value={sessionId}
                onChange={(event) => setSessionId(event.target.value)}
                options={[{ label: "Event-level check-in", value: "" }, ...filteredSessions.map((session) => ({ label: session.title, value: session.id }))]}
              />
            </div>
          </div>
          <div className="flex min-h-80 items-center justify-center rounded-lg border border-white/10 bg-black">
            {cameraActive ? (
              <div id={scannerId} className="w-full max-w-md overflow-hidden rounded-lg" />
            ) : (
              <div className="text-center">
                <Camera className="mx-auto h-10 w-10 text-[#e50913]" aria-hidden />
                <p className="mt-3 text-sm text-[#999999]">Camera scan area</p>
                <Button className="mt-4" onClick={() => setCameraActive(true)}>
                  <Camera className="h-4 w-4" aria-hidden />
                  Start Camera
                </Button>
              </div>
            )}
          </div>
          <div className="grid gap-3 md:grid-cols-[1fr_auto]">
            <div className="space-y-2">
              <Label htmlFor="ticket-code">Manual ticket code</Label>
              <Input id="ticket-code" value={ticketCode} onChange={(event) => setTicketCode(event.target.value)} placeholder="FCF-..." />
            </div>
            <Button className="self-end" onClick={() => submit()} disabled={!ticketCode || isPending}>
              <Keyboard className="h-4 w-4" aria-hidden />
              Check In
            </Button>
          </div>
        </CardContent>
      </Card>
      <Card>
        <CardHeader>
          <CardTitle>Result</CardTitle>
        </CardHeader>
        <CardContent>
          {result ? (
            <div className="space-y-4">
              <div className="rounded-lg border border-white/10 bg-[#0b0b0b] p-4">
                <p className="text-sm text-[#999999]">Status</p>
                <p className="mt-1 text-2xl font-semibold capitalize text-white">{result.result.replaceAll("_", " ")}</p>
              </div>
              {result.attendeeName ? <p className="text-lg font-medium">{result.attendeeName}</p> : null}
              {result.ticketTypeName ? <p className="text-sm text-[#999999]">{result.ticketTypeName}</p> : null}
              {result.priorCheckedInAt ? <p className="text-sm text-red-200">Already checked in at {new Date(result.priorCheckedInAt).toLocaleString()}</p> : null}
            </div>
          ) : (
            <div className="flex min-h-64 flex-col items-center justify-center text-center text-[#999999]">
              <Search className="mb-3 h-8 w-8" aria-hidden />
              Scan, enter, or search for a guest to see check-in status.
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

