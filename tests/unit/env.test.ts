import { describe, expect, it } from "vitest";
import { EnvError, parseEnv } from "@/lib/env";

const base = {
  APP_URL: "http://localhost:3000",
  MONGODB_URI: "mongodb://localhost:27017",
  AUTH_SECRET: "x".repeat(40),
  ADMIN_EMAIL: "Admin@Example.com",
  MAIL_FROM: "Cursos <no-reply@localhost>",
  S3_ENDPOINT: "http://localhost:9000",
  S3_BUCKET: "saas-cursos-files",
  S3_ACCESS_KEY_ID: "key",
  S3_SECRET_ACCESS_KEY: "secret",
};

const prod = {
  ...base,
  APP_ENV: "production",
  APP_URL: "https://cursos.jpavon-tech.com",
  MAIL_PROVIDER: "resend",
  RESEND_API_KEY: "re_test",
  S3_FORCE_PATH_STYLE: "false",
};

describe("parseEnv (desarrollo)", () => {
  it("aplica valores por defecto y normaliza", () => {
    const env = parseEnv(base);
    expect(env).toMatchObject({
      MONGODB_DB: "saas-cursos",
      MAIL_PROVIDER: "smtp",
      MAGIC_LINK_TTL_MINUTES: 15,
      SESSION_TTL_DAYS: 30,
      SMTP_PORT: 1025,
      S3_FORCE_PATH_STYLE: true,
      MAX_UPLOAD_MB: 10,
      ADMIN_EMAIL: "admin@example.com",
      isProduction: false,
      isSecureCookies: false,
    });
  });

  it("trata las variables vacías como no definidas", () => {
    expect(parseEnv({ ...base, RESEND_API_KEY: "", MAGIC_LINK_TTL_MINUTES: "" }).MAGIC_LINK_TTL_MINUTES).toBe(15);
  });

  it("falla con un mensaje claro si falta una obligatoria", () => {
    const { MONGODB_URI: _omit, ...rest } = base;
    expect(() => parseEnv(rest)).toThrow(EnvError);
    expect(() => parseEnv(rest)).toThrow(/MONGODB_URI/);
  });

  it("exige AUTH_SECRET de al menos 32 caracteres", () => {
    expect(() => parseEnv({ ...base, AUTH_SECRET: "corto" })).toThrow(/AUTH_SECRET/);
  });
});

describe("parseEnv (producción)", () => {
  it("acepta una configuración completa", () => {
    const env = parseEnv(prod);
    expect(env.isProduction).toBe(true);
    expect(env.isSecureCookies).toBe(true);
  });

  it("se activa también con VERCEL_ENV=production", () => {
    const { APP_ENV: _omit, ...rest } = prod;
    expect(parseEnv({ ...rest, VERCEL_ENV: "production" }).isProduction).toBe(true);
    expect(() => parseEnv({ ...base, VERCEL_ENV: "production" })).toThrow(EnvError);
  });

  it.each([
    ["MAIL_PROVIDER distinto de resend", { MAIL_PROVIDER: "smtp" }, /MAIL_PROVIDER/],
    ["sin RESEND_API_KEY", { RESEND_API_KEY: "" }, /RESEND_API_KEY/],
    ["APP_URL sin https", { APP_URL: "http://cursos.jpavon-tech.com" }, /APP_URL/],
    ["AUTH_SECRET de ejemplo", { AUTH_SECRET: "dev-only-secret-change-me-at-least-32-bytes-long" }, /AUTH_SECRET/],
    ["path-style con R2", { S3_FORCE_PATH_STYLE: "true" }, /S3_FORCE_PATH_STYLE/],
  ])("falla con %s", (_name, override, pattern) => {
    expect(() => parseEnv({ ...prod, ...override })).toThrow(pattern);
  });
});
