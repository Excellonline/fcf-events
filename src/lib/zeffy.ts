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

export function zeffyAmountToMajorUnits(amountInCents: number) {
  return Math.round(amountInCents) / 100;
}

export function getZeffyBuyerEmail(payment: ZeffyPayment) {
  return payment.buyer?.email?.trim().toLowerCase() || null;
}
