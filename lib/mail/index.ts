import { getEnv } from "@/lib/env";
import { createResendMailer } from "./resend";
import { createSmtpMailer } from "./smtp";
import type { Mailer } from "./types";

export type { Mailer, MailMessage } from "./types";

/** Proveedor según `MAIL_PROVIDER`: smtp (MailHog en local) o resend (producción). */
export function getMailer(): Mailer {
  const env = getEnv();
  if (env.MAIL_PROVIDER === "resend") {
    if (!env.RESEND_API_KEY) throw new Error("RESEND_API_KEY es obligatoria con MAIL_PROVIDER=resend");
    return createResendMailer({ apiKey: env.RESEND_API_KEY, from: env.MAIL_FROM });
  }
  return createSmtpMailer({ host: env.SMTP_HOST, port: env.SMTP_PORT, secure: env.SMTP_SECURE, from: env.MAIL_FROM });
}
