"use client";

import QRCode from "react-qr-code";

export function TicketQr({ value, size = 220 }: { value: string; size?: number }) {
  return (
    <div className="max-w-full rounded-lg bg-white p-4" style={{ width: size + 32 }}>
      <QRCode value={value} size={size} level="M" style={{ height: "auto", maxWidth: "100%", width: "100%" }} />
    </div>
  );
}
