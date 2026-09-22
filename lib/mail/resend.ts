import { Resend } from "resend";
import type { Mailer } from "./types";

export function createResendMailer(opts: { apiKey: string; from: string; client?: Pick<Resend, "emails"> }): Mailer {
  const client = opts.client ?? new Resend(opts.apiKey);
  return {
    async send(message) {
      const { error } = await client.emails.send({ from: opts.from, ...message });
      if (error) throw new Error(`Resend: ${error.message}`);
    },
  };
}
