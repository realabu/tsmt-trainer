import { clearStoredAuth } from "./auth-storage";

export const API_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:4000";

export function getApiUrl(path: string) {
  if (typeof window !== "undefined" && path.startsWith("/api/")) {
    return path;
  }

  return `${API_URL}${path}`;
}

export function getApiDocsUrl() {
  return getApiUrl("/api/docs");
}

export async function apiFetch<T>(
  path: string,
  init?: RequestInit,
  accessToken?: string | null,
): Promise<T> {
  const headers = new Headers(init?.headers);
  headers.set("Content-Type", "application/json");
  if (accessToken) {
    headers.set("Authorization", `Bearer ${accessToken}`);
  }

  const response = await fetch(getApiUrl(path), {
    ...init,
    headers,
    cache: "no-store",
  });

  if (!response.ok) {
    let message = `API hiba (${response.status})`;
    try {
      const body = (await response.json()) as { message?: string | string[] };
      if (Array.isArray(body.message)) {
        message = body.message.join(", ");
      } else if (body.message) {
        message = body.message;
      }
    } catch {}

    if (
      response.status === 401 &&
      accessToken &&
      (message === "Invalid or expired access token" || message === "Missing Authorization header")
    ) {
      clearStoredAuth();
    }

    throw new Error(message);
  }

  return (await response.json()) as T;
}
