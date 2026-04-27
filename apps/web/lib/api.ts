import {
  clearStoredAuth,
  getStoredAccessToken,
  getStoredRefreshToken,
  setStoredAuthTokens,
} from "./auth-storage";

export const API_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:4000";
const AUTH_FAILURE_MESSAGES = new Set([
  "Invalid or expired access token",
  "Missing Authorization header",
]);

export function getApiUrl(path: string) {
  if (typeof window !== "undefined" && path.startsWith("/api/")) {
    return path;
  }

  return `${API_URL}${path}`;
}

export function getApiDocsUrl() {
  return getApiUrl("/api/docs");
}

async function getApiErrorMessage(response: Response) {
  let message = `API hiba (${response.status})`;
  try {
    const body = (await response.json()) as { message?: string | string[] };
    if (Array.isArray(body.message)) {
      message = body.message.join(", ");
    } else if (body.message) {
      message = body.message;
    }
  } catch {}

  return message;
}

function getRequestAccessToken(path: string, accessToken?: string | null) {
  if (accessToken) {
    return accessToken;
  }

  if (accessToken === null && path.startsWith("/api/auth/")) {
    return null;
  }

  if (accessToken === undefined && path.startsWith("/api/auth/")) {
    return undefined;
  }

  if (typeof window !== "undefined") {
    return getStoredAccessToken();
  }

  return accessToken;
}

async function refreshStoredAuthTokens() {
  const refreshToken = typeof window !== "undefined" ? getStoredRefreshToken() : null;
  if (!refreshToken) {
    return null;
  }

  const response = await fetch(getApiUrl("/api/auth/refresh"), {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ refreshToken }),
    cache: "no-store",
  });

  if (!response.ok) {
    throw new Error(await getApiErrorMessage(response));
  }

  const body = (await response.json()) as {
    accessToken: string;
    refreshToken: string;
  };
  setStoredAuthTokens(body.accessToken, body.refreshToken);

  return body.accessToken;
}

async function apiFetchInternal<T>(
  path: string,
  init?: RequestInit,
  accessToken?: string | null,
  hasRetried = false,
): Promise<T> {
  const headers = new Headers(init?.headers);
  headers.set("Content-Type", "application/json");
  const requestAccessToken = getRequestAccessToken(path, accessToken);
  if (requestAccessToken) {
    headers.set("Authorization", `Bearer ${requestAccessToken}`);
  }

  const response = await fetch(getApiUrl(path), {
    ...init,
    headers,
    cache: "no-store",
  });

  if (!response.ok) {
    const message = await getApiErrorMessage(response);
    const shouldHandleAuthFailure =
      response.status === 401 &&
      Boolean(requestAccessToken) &&
      AUTH_FAILURE_MESSAGES.has(message) &&
      path !== "/api/auth/refresh";

    if (shouldHandleAuthFailure && !hasRetried) {
      try {
        const refreshedAccessToken = await refreshStoredAuthTokens();
        if (refreshedAccessToken) {
          return apiFetchInternal<T>(path, init, refreshedAccessToken, true);
        }
      } catch (refreshError) {
        clearStoredAuth();
        throw refreshError instanceof Error ? refreshError : new Error(message);
      }
    }

    if (shouldHandleAuthFailure) {
      clearStoredAuth();
    }

    throw new Error(message);
  }

  return (await response.json()) as T;
}

export async function apiFetch<T>(
  path: string,
  init?: RequestInit,
  accessToken?: string | null,
): Promise<T> {
  return apiFetchInternal(path, init, accessToken);
}
