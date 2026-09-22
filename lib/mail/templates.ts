import type { MailMessage } from "./types";

function escapeHtml(value: string): string {
  return value.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
}

/** Misma plantilla para todos los proveedores. Estilos en línea: los clientes de correo ignoran las hojas externas. */
export function magicLinkEmail(input: { to: string; url: string; ttlMinutes: number }): MailMessage {
  const url = escapeHtml(input.url);
  return {
    to: input.to,
    subject: "Tu enlace para entrar en Cursos",
    text: [
      "Hola,",
      "",
      "Usa este enlace para entrar en Cursos. Solo funciona una vez:",
      input.url,
      "",
      `Caduca en ${input.ttlMinutes} minutos. Si no lo has pedido tú, ignora este mensaje.`,
    ].join("\n"),
    html: `<!doctype html>
<html lang="es"><body style="margin:0;background:#f2f4f8;padding:32px 16px;font-family:Helvetica,Arial,sans-serif;color:#0c1230">
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:480px;margin:0 auto;background:#ffffff;border:1px solid #d5dae6;border-radius:6px">
    <tr><td style="padding:32px">
      <p style="margin:0 0 24px;font-size:20px;font-weight:800;letter-spacing:-0.01em">cursos<span style="color:#2b3ff0">●</span></p>
      <h1 style="margin:0 0 12px;font-size:22px;line-height:1.25">Tu enlace para entrar</h1>
      <p style="margin:0 0 24px;font-size:15px;line-height:1.5;color:#3d4668">Pulsa el botón para iniciar sesión. El enlace funciona una sola vez y caduca en ${input.ttlMinutes} minutos.</p>
      <p style="margin:0 0 24px"><a href="${url}" style="display:inline-block;background:#2b3ff0;color:#ffffff;text-decoration:none;font-weight:700;font-size:15px;padding:12px 20px;border-radius:4px">Entrar en Cursos</a></p>
      <p style="margin:0;font-size:13px;line-height:1.5;color:#5b6482">Si el botón no funciona, copia esta dirección en tu navegador:<br><span style="word-break:break-all">${url}</span></p>
      <p style="margin:24px 0 0;font-size:13px;color:#5b6482">Si no lo has pedido tú, ignora este mensaje.</p>
    </td></tr>
  </table>
</body></html>`,
  };
}
