import { defineConfig, devices } from "@playwright/test";
import { loadWorkspaceEnv } from "./test/smoke/smoke-env";

const workspaceEnv = loadWorkspaceEnv();

export default defineConfig({
  testDir: "./test/smoke",
  testMatch: /auth-dashboard-smoke\.spec\.ts/,
  outputDir: "./.test-dist/playwright/auth-results",
  reporter: [["list"]],
  timeout: 45_000,
  use: {
    baseURL: "http://localhost:3000",
    trace: "retain-on-failure",
  },
  webServer: [
    {
      command: "pnpm --dir ../.. --filter @tsmt/api dev",
      env: {
        DATABASE_URL: workspaceEnv.DATABASE_URL,
        JWT_ACCESS_SECRET: workspaceEnv.JWT_ACCESS_SECRET ?? "browser-smoke-access-secret",
        JWT_REFRESH_SECRET: workspaceEnv.JWT_REFRESH_SECRET ?? "browser-smoke-refresh-secret",
      },
      reuseExistingServer: !process.env.CI,
      timeout: 120_000,
      url: "http://127.0.0.1:4000/api/health",
    },
    {
      command: "pnpm dev",
      env: {
        NEXT_PUBLIC_API_URL: "http://127.0.0.1:4000",
      },
      reuseExistingServer: !process.env.CI,
      timeout: 120_000,
      url: "http://localhost:3000",
    },
  ],
  projects: [
    {
      name: "chromium",
      use: { ...devices["Desktop Chrome"] },
    },
  ],
});
