import { env } from "@/lib/env";

export type ZeffyQuestionAnswer = {
  question: string;
  type: string;
  answer: string | string[] | boolean;
};

export type ZeffyItem = {
  id: string;
  type: "donation" | "ticket" | "additional_donation";
  amount: number;
  currency: string;
  rate_id: string | null;
  contact_id: string | null;
  questions: ZeffyQuestionAnswer[];
};

export type ZeffyPayment = {
  id: string;
  created: number;
  amount: number;
  currency: string;
  status: string;
  type: "online" | "manual" | "imported";
  refund_status: "none" | "partial" | "full";
  contact: string | null;
  buyer: {
    email: string | null;
    first_name: string | null;
    last_name: string | null;
    is_corporate: boolean;
    company_name: string | null;
  };
  campaign_id: string;
  campaign_type: string;
  campaign_category: string;
  buyer_questions: ZeffyQuestionAnswer[];
  items: ZeffyItem[];
  receipt_url: string | null;
  metadata: Record<string, unknown>;
};

export type ZeffyPaymentCompletedEvent = {
  id: string;
  type: "payment.completed";
  version: number;
  dispatchedAt: string;
  data: ZeffyPayment;
};

export type ZeffyTicketOffer = {
  name: string;
  description: string;
  price: number;
  currency: string;
};

type ZeffyList<T> = {
  object: "list";
  data: T[];
  has_more: boolean;
  next_cursor: string | null;
};

export function buildZeffyPaymentUrl({
  formUrl,
  registrationId,
  eventSlug,
}: {
  formUrl: string;
  registrationId: string;
  eventSlug: string;
}) {
  const url = new URL(formUrl);
  url.searchParams.set("utm_source", "fcf_events");
  url.searchParams.set("utm_medium", "registration_redirect");
  url.searchParams.set("utm_campaign", eventSlug);
  url.searchParams.set("fcf_registration_id", registrationId);
  return url.toString();
}

export async function listZeffyPayments(params: Record<string, string | number | undefined> = {}) {
  if (!env.zeffyApiKey) {
    throw new Error("Zeffy API key is not configured.");
  }

  const url = new URL("/api/v1/payments", env.zeffyApiBase);
  for (const [key, value] of Object.entries(params)) {
    if (value !== undefined) url.searchParams.set(key, String(value));
  }

  const response = await fetch(url, {
    headers: {
      Authorization: `Bearer ${env.zeffyApiKey}`,
      Accept: "application/json",
    },
    cache: "no-store",
  });

  if (!response.ok) {
    throw new Error(`Zeffy payments request failed with ${response.status}.`);
  }

  return (await response.json()) as ZeffyList<ZeffyPayment>;
}

export async function fetchZeffyTicketOffers(formUrl: string): Promise<ZeffyTicketOffer[]> {
  const response = await fetch(formUrl, {
    headers: {
      Accept: "text/html,application/xhtml+xml",
      "User-Agent": "FCF Events Zeffy Sync",
    },
    cache: "no-store",
  });

  if (!response.ok) {
    throw new Error(`Zeffy form request failed with ${response.status}.`);
  }

  const html = await response.text();
  return extractTicketOffersFromHtml(html);
}

export function zeffyAmountToMajorUnits(amountInCents: number) {
  return Math.round(amountInCents) / 100;
}

export function getZeffyBuyerEmail(payment: ZeffyPayment) {
  return payment.buyer?.email?.trim().toLowerCase() || null;
}

function extractTicketOffersFromHtml(html: string): ZeffyTicketOffer[] {
  const scripts = html.matchAll(/<script\b[^>]*type=["']application\/ld\+json["'][^>]*>([\s\S]*?)<\/script>/gi);
  const offers: ZeffyTicketOffer[] = [];

  for (const match of scripts) {
    const json = match[1]?.trim();
    if (!json) continue;

    try {
      collectTicketOffers(JSON.parse(json), offers);
    } catch {
      continue;
    }
  }

  return dedupeTicketOffers(offers);
}

function collectTicketOffers(value: unknown, offers: ZeffyTicketOffer[]) {
  if (Array.isArray(value)) {
    for (const item of value) collectTicketOffers(item, offers);
    return;
  }

  if (!value || typeof value !== "object") return;

  const record = value as Record<string, unknown>;
  const recordOffers = record.offers;
  if (recordOffers) {
    for (const offer of Array.isArray(recordOffers) ? recordOffers : [recordOffers]) {
      const ticketOffer = normalizeTicketOffer(offer);
      if (ticketOffer) offers.push(ticketOffer);
    }
  }

  for (const nested of Object.values(record)) {
    if (nested && typeof nested === "object") collectTicketOffers(nested, offers);
  }
}

function normalizeTicketOffer(value: unknown): ZeffyTicketOffer | null {
  if (!value || typeof value !== "object") return null;

  const offer = value as Record<string, unknown>;
  const type = String(offer["@type"] ?? offer.type ?? "").toLowerCase();
  if (type && type !== "offer") return null;

  const availability = String(offer.availability ?? "").toLowerCase();
  if (availability.includes("outofstock") || availability.includes("soldout")) return null;

  const name = decodeHtmlText(String(offer.name ?? "")).trim();
  const price = Number(offer.price);
  const currency = String(offer.priceCurrency ?? offer.currency ?? "CAD").trim().toUpperCase();

  if (!name || !Number.isFinite(price) || price < 0 || !/^[A-Z]{3}$/.test(currency)) return null;

  return {
    name,
    description: decodeHtmlText(String(offer.description ?? "")).trim(),
    price,
    currency,
  };
}

function dedupeTicketOffers(offers: ZeffyTicketOffer[]) {
  const seen = new Set<string>();
  return offers.filter((offer) => {
    const key = `${offer.name.toLowerCase()}:${offer.price}:${offer.currency}`;
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}

function decodeHtmlText(value: string) {
  return value.replace(/&(#x?[0-9a-f]+|[a-z]+);/gi, (match, entity: string) => {
    const normalized = entity.toLowerCase();
    if (normalized.startsWith("#x")) {
      const codePoint = Number.parseInt(normalized.slice(2), 16);
      return Number.isFinite(codePoint) ? String.fromCodePoint(codePoint) : match;
    }
    if (normalized.startsWith("#")) {
      const codePoint = Number.parseInt(normalized.slice(1), 10);
      return Number.isFinite(codePoint) ? String.fromCodePoint(codePoint) : match;
    }

    return (
      {
        amp: "&",
        apos: "'",
        gt: ">",
        lt: "<",
        nbsp: " ",
        quot: '"',
      }[normalized] ?? match
    );
  });
}
