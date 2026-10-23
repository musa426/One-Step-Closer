import { defineConfig } from "@playwright/test";

export default defineConfig({
  testDir: ".",
  testMatch: "backup-format.spec.ts",
  workers: 1,
  reporter: "list"
});
