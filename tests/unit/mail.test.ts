import { describe, expect, it, vi } from "vitest";
import { createResendMailer } from "@/lib/mail/resend";
import { createSmtpMailer } from "@/lib/mail/smtp";

const message = { to: "a@b.co", subject: "Asunto", html: "<p>hola</p>", text: "hola" };

describe("createResendMailer", () => {
  it("llama a emails.send con el remitente configurado", async () => {
    const send = vi.fn().mockResolvedValue({ data: { id: "1" }, error: null });
    const mailer = createResendMailer({ apiKey: "re_test", from: "Cursos <no-reply@x.com>", client: { emails: { send } } as never });
    await mailer.send(message);
    expect(send).toHaveBeenCalledWith({ from: "Cursos <no-reply@x.com>", ...message });
  });

  it("lanza si Resend devuelve error", async () => {
    const send = vi.fn().mockResolvedValue({ data: null, error: { message: "dominio no verificado" } });
    const mailer = createResendMailer({ apiKey: "re_test", from: "Cursos <no-reply@x.com>", client: { emails: { send } } as never });
    await expect(mailer.send(message)).rejects.toThrow(/dominio no verificado/);
  });
});

describe("createSmtpMailer", () => {
  it("existe y expone send()", () => {
    const mailer = createSmtpMailer({ host: "localhost", port: 1025, secure: false, from: "Cursos <no-reply@localhost>" });
    expect(typeof mailer.send).toBe("function");
  });
});
