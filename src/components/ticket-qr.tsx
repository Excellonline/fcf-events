"use client";

import QRCode from "react-qr-code";

export function TicketQr({ value }: { value: string }) {
  return (
    <div className="rounded-lg bg-white p-4">
      <QRCode value={value} size={220} level="M" />
    </div>
  );
}

