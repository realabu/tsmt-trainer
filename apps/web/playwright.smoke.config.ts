import { defineConfig, devices } from "@playwright/test";

export default defineConfig({
  testDir: "./test/smoke",
  outputDir: "./.test-dist/playwright/test-results",
  reporter: [["list"]],
  timeout: 30_000,
  use: {
    baseURL: "http://localhost:3000",
    trace: "retain-on-failure",
  },
  webServer: {
    command: "pnpm dev",
    env: {
      NEXT_PUBLIC_API_URL: "http://127.0.0.1:4000",
    },
    reuseExistingServer: !process.env.CI,
    timeout: 120_000,
    url: "http://localhost:3000",
  },
  projects: [
    {
      name: "chromium",
      use: { ...devices["Desktop Chrome"] },
    },
  ],
});
