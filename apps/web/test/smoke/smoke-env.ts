import { existsSync, readFileSync } from "node:fs";
import { resolve } from "node:path";

function parseEnvValue(value: string) {
  return value.trim().replace(/^["']|["']$/g, "");
}

export function loadWorkspaceEnv() {
  const envPath = resolve(process.cwd(), "../../.env");
  if (existsSync(envPath)) {
    const lines = readFileSync(envPath, "utf8").split(/\r?\n/);
    for (const line of lines) {
      const trimmed = line.trim();
      if (!trimmed || trimmed.startsWith("#")) {
        continue;
      }

      const separatorIndex = trimmed.indexOf("=");
      if (separatorIndex === -1) {
        continue;
      }

      const key = trimmed.slice(0, separatorIndex).trim();
      const value = parseEnvValue(trimmed.slice(separatorIndex + 1));
      process.env[key] ??= value;
    }
  }

  if (!process.env.DATABASE_URL) {
    throw new Error(
      [
        "DATABASE_URL is required for authenticated browser smoke.",
        "Run `pnpm --filter @tsmt/web test:smoke:app` for the DB-free app-load smoke.",
        "Run authenticated/full browser smoke only after Postgres is reachable and migrations are applied, for example with `pnpm db:migrate:deploy` against the same DATABASE_URL.",
      ].join(" "),
    );
  }

  return {
    DATABASE_URL: process.env.DATABASE_URL,
    JWT_ACCESS_SECRET: process.env.JWT_ACCESS_SECRET,
    JWT_REFRESH_SECRET: process.env.JWT_REFRESH_SECRET,
  };
}
