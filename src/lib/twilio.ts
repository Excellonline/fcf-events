import { env } from "@/lib/env";
import { sendTwilioSms } from "@/lib/sms/twilio";

type SmsInput = {
  body: string;
  to: string;
};

export class TwilioConfigurationError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "TwilioConfigurationError";
  }
}

function readRequiredEnv(name: string): string {
  const value = process.env[name]?.trim();

  if (!value) {
    throw new TwilioConfigurationError(`Missing ${name}.`);
  }

  return value;
}

export async function sendSms({ body, to }: SmsInput) {
  const accountSid = readRequiredEnv("TWILIO_ACCOUNT_SID");
  const authToken = readRequiredEnv("TWILIO_AUTH_TOKEN");
  const from = process.env.TWILIO_FROM_NUMBER?.trim();
  const messagingServiceSid = process.env.TWILIO_MESSAGING_SERVICE_SID?.trim();

  if (!from && !messagingServiceSid) {
    throw new TwilioConfigurationError("Missing TWILIO_FROM_NUMBER or TWILIO_MESSAGING_SERVICE_SID.");
  }

  const result = await sendTwilioSms({
    accountSid,
    authToken,
    from,
    messagingServiceSid,
    to,
    body,
    statusCallback: `${env.appUrl.replace(/\/$/, "")}/api/twilio/status`,
  });

  if (result.error) {
    throw new Error(result.error);
  }

  return {
    sid: result.sid,
    status: result.status,
  };
}
