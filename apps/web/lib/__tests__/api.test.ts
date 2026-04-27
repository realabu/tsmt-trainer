import assert from "node:assert/strict";
import test from "node:test";
import {
  AUTH_ACCESS_TOKEN_KEY,
  AUTH_REFRESH_TOKEN_KEY,
  AUTH_USER_KEY,
} from "../auth-storage";
import { apiFetch } from "../api";

type MockResponse = {
  ok: boolean;
  status: number;
  json(): Promise<unknown>;
};

type FetchCall = {
  url: string;
  init?: RequestInit;
};

function createJsonResponse(status: number, body: unknown): MockResponse {
  return {
    ok: status >= 200 && status < 300,
    status,
    async json() {
      return body;
    },
  };
}

function withMockBrowser<T>(
  run: (context: {
    calls: FetchCall[];
    setFetchQueue: (responses: Array<MockResponse>) => void;
    storage: Map<string, string>;
    location: { href: string };
    events: string[];
  }) => Promise<T> | T,
) {
  const originalWindow = globalThis.window;
  const originalFetch = globalThis.fetch;
  const storage = new Map<string, string>();
  const events: string[] = [];
  const calls: FetchCall[] = [];
  let queue: Array<MockResponse> = [];
  const location = { href: "/current" };

  const windowMock = {
    localStorage: {
      getItem(key: string) {
        return storage.get(key) ?? null;
      },
      setItem(key: string, value: string) {
        storage.set(key, value);
      },
      removeItem(key: string) {
        storage.delete(key);
      },
    },
    location,
    dispatchEvent(event: Event) {
      events.push(event.type);
      return true;
    },
  };

  Object.defineProperty(globalThis, "window", {
    configurable: true,
    value: windowMock,
  });

  Object.defineProperty(globalThis, "fetch", {
    configurable: true,
    value: async (url: string, init?: RequestInit) => {
      calls.push({ url, init });
      const next = queue.shift();
      if (!next) {
        throw new Error("Unexpected fetch call");
      }
      return next;
    },
  });

  const setFetchQueue = (responses: Array<MockResponse>) => {
    queue = [...responses];
  };

  return Promise.resolve()
    .then(() => run({ calls, setFetchQueue, storage, location, events }))
    .finally(() => {
      Object.defineProperty(globalThis, "window", {
        configurable: true,
        value: originalWindow,
      });
      Object.defineProperty(globalThis, "fetch", {
        configurable: true,
        value: originalFetch,
      });
    });
}

test("attaches provided access token", async () => {
  await withMockBrowser(async ({ calls, setFetchQueue }) => {
    setFetchQueue([createJsonResponse(200, { success: true })]);

    await apiFetch("/api/children", undefined, "access-1");

    const headers = new Headers(calls[0]?.init?.headers);
    assert.equal(headers.get("Authorization"), "Bearer access-1");
  });
});

test("returns response JSON on normal success", async () => {
  await withMockBrowser(async ({ setFetchQueue }) => {
    setFetchQueue([createJsonResponse(200, { id: "child-1" })]);

    const result = await apiFetch<{ id: string }>("/api/children");

    assert.deepEqual(result, { id: "child-1" });
  });
});

test("throws parsed non-401 error and does not refresh", async () => {
  await withMockBrowser(async ({ calls, setFetchQueue }) => {
    setFetchQueue([createJsonResponse(400, { message: "Rossz keres" })]);

    await assert.rejects(apiFetch("/api/children"), {
      message: "Rossz keres",
    });
    assert.equal(calls.length, 1);
    assert.equal(calls[0]?.url, "/api/children");
  });
});

test("401 invalid token with refresh token refreshes, stores tokens, retries once, and returns retried response", async () => {
  await withMockBrowser(async ({ calls, setFetchQueue, storage }) => {
    storage.set(AUTH_REFRESH_TOKEN_KEY, "refresh-old");
    setFetchQueue([
      createJsonResponse(401, { message: "Invalid or expired access token" }),
      createJsonResponse(200, { accessToken: "access-new", refreshToken: "refresh-new" }),
      createJsonResponse(200, { ok: true }),
    ]);

    const result = await apiFetch<{ ok: boolean }>("/api/children", undefined, "access-old");

    assert.deepEqual(result, { ok: true });
    assert.equal(calls.length, 3);
    assert.equal(calls[1]?.url, "/api/auth/refresh");
    assert.equal(calls[1]?.init?.method, "POST");
    assert.equal(calls[1]?.init?.body, JSON.stringify({ refreshToken: "refresh-old" }));
    assert.equal(storage.get(AUTH_ACCESS_TOKEN_KEY), "access-new");
    assert.equal(storage.get(AUTH_REFRESH_TOKEN_KEY), "refresh-new");
    const retryHeaders = new Headers(calls[2]?.init?.headers);
    assert.equal(retryHeaders.get("Authorization"), "Bearer access-new");
  });
});

test("401 invalid token with no refresh token clears stored auth", async () => {
  await withMockBrowser(async ({ setFetchQueue, storage, location, events }) => {
    storage.set(AUTH_ACCESS_TOKEN_KEY, "access-old");
    storage.set(AUTH_USER_KEY, '{"id":"user-1"}');
    setFetchQueue([createJsonResponse(401, { message: "Invalid or expired access token" })]);

    await assert.rejects(apiFetch("/api/children", undefined, "access-old"), {
      message: "Invalid or expired access token",
    });

    assert.equal(storage.get(AUTH_ACCESS_TOKEN_KEY), undefined);
    assert.equal(storage.get(AUTH_REFRESH_TOKEN_KEY), undefined);
    assert.equal(storage.get(AUTH_USER_KEY), undefined);
    assert.equal(location.href, "/");
    assert.ok(events.includes("tsmt-auth-changed"));
  });
});

test("refresh failure clears auth and throws a meaningful auth error", async () => {
  await withMockBrowser(async ({ setFetchQueue, storage, location }) => {
    storage.set(AUTH_REFRESH_TOKEN_KEY, "refresh-old");
    storage.set(AUTH_ACCESS_TOKEN_KEY, "access-old");
    storage.set(AUTH_USER_KEY, '{"id":"user-1"}');
    setFetchQueue([
      createJsonResponse(401, { message: "Invalid or expired access token" }),
      createJsonResponse(401, { message: "Ervenytelen refresh token." }),
    ]);

    await assert.rejects(apiFetch("/api/children", undefined, "access-old"), {
      message: "Ervenytelen refresh token.",
    });

    assert.equal(storage.get(AUTH_ACCESS_TOKEN_KEY), undefined);
    assert.equal(storage.get(AUTH_REFRESH_TOKEN_KEY), undefined);
    assert.equal(storage.get(AUTH_USER_KEY), undefined);
    assert.equal(location.href, "/");
  });
});

test("retry also failing clears auth and does not loop infinitely", async () => {
  await withMockBrowser(async ({ calls, setFetchQueue, storage, location }) => {
    storage.set(AUTH_REFRESH_TOKEN_KEY, "refresh-old");
    storage.set(AUTH_ACCESS_TOKEN_KEY, "access-old");
    storage.set(AUTH_USER_KEY, '{"id":"user-1"}');
    setFetchQueue([
      createJsonResponse(401, { message: "Invalid or expired access token" }),
      createJsonResponse(200, { accessToken: "access-new", refreshToken: "refresh-new" }),
      createJsonResponse(401, { message: "Invalid or expired access token" }),
    ]);

    await assert.rejects(apiFetch("/api/children", undefined, "access-old"), {
      message: "Invalid or expired access token",
    });

    assert.equal(calls.length, 3);
    assert.equal(storage.get(AUTH_ACCESS_TOKEN_KEY), undefined);
    assert.equal(storage.get(AUTH_REFRESH_TOKEN_KEY), undefined);
    assert.equal(storage.get(AUTH_USER_KEY), undefined);
    assert.equal(location.href, "/");
  });
});
