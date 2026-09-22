import { describe, expect, it } from "vitest";
import { resolveNext } from "@/lib/auth/next-path";
import { signSession, verifySessionToken } from "@/lib/auth/session";
import { generateToken, hashToken } from "@/lib/auth/tokens";

const secret = "s".repeat(48);
const session = { userId: "64b7f0c2a1b2c3d4e5f60718", email: "a@b.co", name: "Ana", role: "student" as const };

describe("tokens", () => {
  it("genera 32 bytes en base64url y nunca repite", () => {
    const a = generateToken();
    expect(a).toMatch(/^[A-Za-z0-9_-]{43}$/);
    expect(generateToken()).not.toBe(a);
  });
  it("hashea de forma determinista con SHA-256", () => {
    expect(hashToken("abc")).toBe("ba7816bf8f01cfea414140de5dae2223b00361a396177a9cb410ff61f20015ad");
  });
});

describe("sesión firmada", () => {
  it("hace ida y vuelta", async () => {
    const token = await signSession(session, { secret, ttlDays: 1 });
    expect(await verifySessionToken(token, secret)).toEqual(session);
  });
  it("rechaza firmas ajenas, tokens manipulados y caducados", async () => {
    const token = await signSession(session, { secret, ttlDays: 1 });
    expect(await verifySessionToken(token, "o".repeat(48))).toBeNull();
    expect(await verifySessionToken(token.slice(0, -2) + "xx", secret)).toBeNull();
    expect(await verifySessionToken(undefined, secret)).toBeNull();
    const expired = await signSession(session, { secret, ttlDays: -1 });
    expect(await verifySessionToken(expired, secret)).toBeNull();
  });
});

describe("resolveNext", () => {
  it("usa la home del rol sin next", () => {
    expect(resolveNext(undefined, "admin")).toBe("/admin");
    expect(resolveNext(undefined, "student")).toBe("/student");
  });
  it("respeta un next interno permitido", () => {
    expect(resolveNext("/student/courses/x", "student")).toBe("/student/courses/x");
    expect(resolveNext("/admin/courses", "admin")).toBe("/admin/courses");
  });
  it("no envía a un student a /admin ni a sitios externos", () => {
    expect(resolveNext("/admin", "student")).toBe("/student");
    expect(resolveNext("//evil.com", "student")).toBe("/student");
    expect(resolveNext("https://evil.com", "admin")).toBe("/admin");
  });
});
