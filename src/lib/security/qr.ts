import { createHash, randomBytes } from "crypto";
import { env } from "@/lib/env";

export function createTicketCode() {
  return `FCF-${randomBytes(9).toString("base64url").toUpperCase()}`;
}

export function hashTicketToken(ticketCode: string) {
  return createHash("sha256").update(ticketCode).digest("hex");
}

export function ticketUrl(ticketCode: string) {
  return `${env.appUrl.replace(/\/$/, "")}/ticket/${encodeURIComponent(ticketCode)}`;
}

