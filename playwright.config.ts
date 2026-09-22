import { defineConfig, devices } from "@playwright/test";
import { BASE_URL, E2E_DB, IS_LOCAL_TARGET } from "./tests/e2e/env";

const port = new URL(BASE_URL).port || "3100";

export default defineConfig({
  testDir: "./tests/e2e",
  outputDir: "test-results",
  fullyParallel: true,
  forbidOnly: Boolean(process.env.CI),
  retries: process.env.CI ? 1 : 0,
  workers: process.env.CI ? 1 : 2,
  timeout: 30_000,
  expect: { timeout: 7_000 },
  reporter: [["list"], ["html", { open: "never" }]],
  globalSetup: IS_LOCAL_TARGET ? "./tests/e2e/global-setup.ts" : undefined,
  use: {
    baseURL: BASE_URL,
    locale: "es-ES",
    trace: "retain-on-failure",
    screenshot: "only-on-failure",
    video: "retain-on-failure",
  },
  projects: [
    { name: "setup", testMatch: /auth\.setup\.ts/ },
    {
      name: "chromium",
      use: { ...devices["Desktop Chrome"] },
      dependencies: ["setup"],
      testIgnore: /auth\.setup\.ts/,
    },
    {
      // Solo lectura y sin credenciales: apto para ejecutarse contra producción.
      name: "smoke",
      use: { ...devices["Desktop Chrome"] },
      grep: /@smoke/,
      testMatch: /smoke\.spec\.ts/,
    },
  ],
  webServer: IS_LOCAL_TARGET
    ? {
        // Local: `next dev` (detén tu propio `npm run dev`: comparten lock). CI: build previo + `next start`.
        command: process.env.CI ? `npm run start -- -p ${port}` : `npm run dev -- -p ${port}`,
        url: `${BASE_URL}/api/health`,
        reuseExistingServer: false,
        timeout: 120_000,
        env: {
          MONGODB_DB: E2E_DB,
          APP_URL: BASE_URL,
          PORT: port,
        },
      }
    : undefined,
});
