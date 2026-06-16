import { env } from "@/lib/env";

type ResendAttachment = {
  filename: string;
  content: string;
  content_type?: string;
  content_id?: string;
  content_disposition?: "attachment" | "inline";
};

type SendEmailInput = {
  to: string | string[];
  subject: string;
  html: string;
  text: string;
  attachments?: ResendAttachment[];
  from?: string;
  replyTo?: string;
  tags?: Record<string, string | number | boolean | null | undefined>;
};

type ResendSendResponse = {
  id?: string;
  message?: string;
  name?: string;
  error?: string;
};

export class EmailConfigurationError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "EmailConfigurationError";
  }
}

export async function sendEmail(input: SendEmailInput) {
  if (!env.resendApiKey?.trim()) {
    throw new EmailConfigurationError("Missing RESEND_API_KEY.");
  }

  const from = input.from ?? env.emailFrom;
  if (!from?.trim()) {
    throw new EmailConfigurationError("Missing EMAIL_FROM.");
  }

  const response = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${env.resendApiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      from,
      to: Array.isArray(input.to) ? input.to : [input.to],
      subject: input.subject,
      html: input.html,
      text: input.text,
      reply_to: input.replyTo ?? env.emailReplyTo,
      attachments: input.attachments,
      tags: formatTags(input.tags),
    }),
  });

  const payload = await parseResendResponse(response);
  if (!response.ok) {
    throw new Error(payload.message ?? payload.error ?? payload.name ?? "Resend rejected the email.");
  }

  return { id: payload.id };
}

function formatTags(tags: SendEmailInput["tags"]) {
  if (!tags) return undefined;

  return Object.entries(tags).flatMap(([name, value]) => {
    if (value === null || value === undefined) return [];
    return { name, value: String(value) };
  });
}

async function parseResendResponse(response: Response): Promise<ResendSendResponse> {
  const rawPayload = await response.text();
  if (!rawPayload) return {};

  try {
    return JSON.parse(rawPayload) as ResendSendResponse;
  } catch {
    return { message: rawPayload };
  }
}
