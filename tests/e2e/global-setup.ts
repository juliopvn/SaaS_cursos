import { execFileSync } from "node:child_process";
import { E2E_DB, MONGODB_URI } from "./env";

/** Base limpia y repetible: `seed --reset` sobre la BD de E2E (el seed rechaza URIs no locales). */
export default function globalSetup() {
  execFileSync("npx", ["tsx", "scripts/seed.ts", "--reset"], {
    stdio: "inherit",
    env: { ...process.env, MONGODB_URI, MONGODB_DB: E2E_DB },
  });
}
