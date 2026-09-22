import nodemailer from "nodemailer";
import type { Mailer } from "./types";

export function createSmtpMailer(opts: { host: string; port: number; secure: boolean; from: string }): Mailer {
  const transport = nodemailer.createTransport({ host: opts.host, port: opts.port, secure: opts.secure });
  return {
    async send(message) {
      await transport.sendMail({ from: opts.from, ...message });
    },
  };
}
