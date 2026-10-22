import { defineConfig, devices } from "@playwright/test";

const externalURL = process.env.PLAYWRIGHT_BASE_URL;

export default defineConfig({
  testDir: "./tests",
  testMatch: "**/*.spec.ts",
  fullyParallel: false,
  workers: 1,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 1 : 0,
  reporter: "list",
  use: {
    baseURL: externalURL || "http://127.0.0.1:3117",
    trace: "retain-on-failure",
    ...devices["Desktop Chrome"]
  },
  webServer: externalURL ? undefined : {
    command: "npm run start -- --hostname 127.0.0.1 --port 3117",
    url: "http://127.0.0.1:3117",
    reuseExistingServer: !process.env.CI,
    timeout: 60_000
  }
});
