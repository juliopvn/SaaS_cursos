import { describe, expect, it } from "vitest";
import { assertSafeToReset, isLocalMongoUri, mongoHosts } from "@/lib/seed-guard";

describe("isLocalMongoUri", () => {
  it.each([
    "mongodb://localhost:27017",
    "mongodb://127.0.0.1:27018/saas",
    "mongodb://mongo:27017",
    "mongodb://user:pass@localhost:27017/db?authSource=admin",
    "mongodb://localhost:27017,localhost:27018",
  ])("acepta %s", (uri) => expect(isLocalMongoUri(uri)).toBe(true));

  it.each([
    "mongodb+srv://u:p@cluster0.abc.mongodb.net/db",
    "mongodb+srv://localhost/db",
    "mongodb://remote.example.com:27017",
    "mongodb://localhost:27017,evil.example.com:27017",
    "mongodb://localhost@evil.example.com:27017",
    "mongodb://evil.com/localhost",
    "",
  ])("rechaza %s", (uri) => expect(isLocalMongoUri(uri)).toBe(false));
});

describe("assertSafeToReset", () => {
  it("lanza con una URI remota", () => {
    expect(() => assertSafeToReset("mongodb://db.prod.example.com:27017")).toThrow(/rechazado/);
  });
  it("no lanza en local", () => expect(() => assertSafeToReset("mongodb://localhost:27017")).not.toThrow());
});

describe("mongoHosts", () => {
  it("ignora credenciales y puertos", () => {
    expect(mongoHosts("mongodb://u:p@A.example.com:1,b.example.com:2/db")).toEqual(["a.example.com", "b.example.com"]);
  });
});
