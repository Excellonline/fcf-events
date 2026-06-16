type TwilioSendInput = {
  accountSid: string;
  authToken: string;
  from?: string | null;
  messagingServiceSid?: string | null;
  to: string;
  body: string;
  statusCallback?: string;
};

export type TwilioSendResult = {
  sid?: string;
  status?: string;
  error?: string;
};

export async function sendTwilioSms(input: TwilioSendInput): Promise<TwilioSendResult> {
  if (!input.from && !input.messagingServiceSid) {
    return { error: "Configure a Twilio phone number or Messaging Service SID before sending." };
  }

  const params = new URLSearchParams({
    To: input.to,
    Body: input.body,
  });

  if (input.messagingServiceSid) {
    params.set("MessagingServiceSid", input.messagingServiceSid);
  } else if (input.from) {
    params.set("From", input.from);
  }

  if (input.statusCallback) {
    params.set("StatusCallback", input.statusCallback);
  }

  const response = await fetch(
    `https://api.twilio.com/2010-04-01/Accounts/${input.accountSid}/Messages.json`,
    {
      method: "POST",
      headers: {
        Authorization: `Basic ${Buffer.from(`${input.accountSid}:${input.authToken}`).toString("base64")}`,
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body: params,
    },
  );

  const payload = (await response.json()) as {
    sid?: string;
    status?: string;
    message?: string;
  };

  if (!response.ok) {
    return { error: payload.message ?? "Twilio rejected the message." };
  }

  return { sid: payload.sid, status: payload.status };
}

