import assert from "node:assert/strict";
import test from "node:test";
import {
  AUTH_ACCESS_TOKEN_KEY,
  AUTH_CHANGED_EVENT,
  AUTH_REFRESH_TOKEN_KEY,
  AUTH_USER_KEY,
  clearStoredAuth,
  getStoredAccessToken,
  getStoredAuthUser,
  getStoredRefreshToken,
  notifyAuthChanged,
  setStoredAuthTokens,
  setStoredAuthUser,
  type StoredAuthUser,
} from "../auth-storage";

type MockWindow = {
  localStorage: {
    getItem(key: string): string | null;
    setItem(key: string, value: string): void;
    removeItem(key: string): void;
  };
  location: {
    href: string;
  };
  dispatchEvent(event: Event): boolean;
};

function withMockWindow<T>(run: (windowMock: MockWindow, events: string[]) => T) {
  const originalWindow = globalThis.window;
  const storage = new Map<string, string>();
  const events: string[] = [];

  const windowMock: MockWindow = {
    localStorage: {
      getItem(key) {
        return storage.get(key) ?? null;
      },
      setItem(key, value) {
        storage.set(key, value);
      },
      removeItem(key) {
        storage.delete(key);
      },
    },
    location: {
      href: "/current",
    },
    dispatchEvent(event) {
      events.push(event.type);
      return true;
    },
  };

  Object.defineProperty(globalThis, "window", {
    configurable: true,
    value: windowMock,
  });

  try {
    return run(windowMock, events);
  } finally {
    Object.defineProperty(globalThis, "window", {
      configurable: true,
      value: originalWindow,
    });
  }
}

test("setStoredAuthTokens stores both tokens under existing keys", () => {
  withMockWindow((windowMock) => {
    setStoredAuthTokens("access-1", "refresh-1");

    assert.equal(windowMock.localStorage.getItem(AUTH_ACCESS_TOKEN_KEY), "access-1");
    assert.equal(windowMock.localStorage.getItem(AUTH_REFRESH_TOKEN_KEY), "refresh-1");
  });
});

test("getStoredAccessToken returns the stored access token", () => {
  withMockWindow((windowMock) => {
    windowMock.localStorage.setItem(AUTH_ACCESS_TOKEN_KEY, "access-2");

    assert.equal(getStoredAccessToken(), "access-2");
  });
});

test("getStoredRefreshToken returns the stored refresh token", () => {
  withMockWindow((windowMock) => {
    windowMock.localStorage.setItem(AUTH_REFRESH_TOKEN_KEY, "refresh-2");

    assert.equal(getStoredRefreshToken(), "refresh-2");
  });
});

test("setStoredAuthUser stores JSON and dispatches the existing auth event", () => {
  withMockWindow((windowMock, events) => {
    const user: StoredAuthUser = {
      id: "user-1",
      email: "anna@example.com",
      firstName: "Anna",
      lastName: "Bela",
      role: "PARENT",
    };

    setStoredAuthUser(user);

    assert.equal(windowMock.localStorage.getItem(AUTH_USER_KEY), JSON.stringify(user));
    assert.deepEqual(events, [AUTH_CHANGED_EVENT]);
  });
});

test("getStoredAuthUser returns parsed user", () => {
  withMockWindow((windowMock) => {
    const user: StoredAuthUser = {
      id: "user-2",
      email: "bela@example.com",
      firstName: "Bela",
      lastName: "Cecil",
      role: "TRAINER",
    };
    windowMock.localStorage.setItem(AUTH_USER_KEY, JSON.stringify(user));

    assert.deepEqual(getStoredAuthUser(), user);
  });
});

test("getStoredAuthUser returns null for missing user", () => {
  withMockWindow(() => {
    assert.equal(getStoredAuthUser(), null);
  });
});

test("getStoredAuthUser returns null for invalid JSON", () => {
  withMockWindow((windowMock) => {
    windowMock.localStorage.setItem(AUTH_USER_KEY, "{invalid");

    assert.equal(getStoredAuthUser(), null);
  });
});

test("clearStoredAuth removes all stored auth keys", () => {
  withMockWindow((windowMock, events) => {
    windowMock.localStorage.setItem(AUTH_ACCESS_TOKEN_KEY, "access-3");
    windowMock.localStorage.setItem(AUTH_REFRESH_TOKEN_KEY, "refresh-3");
    windowMock.localStorage.setItem(AUTH_USER_KEY, '{"id":"user-3"}');

    clearStoredAuth(false);

    assert.equal(windowMock.localStorage.getItem(AUTH_ACCESS_TOKEN_KEY), null);
    assert.equal(windowMock.localStorage.getItem(AUTH_REFRESH_TOKEN_KEY), null);
    assert.equal(windowMock.localStorage.getItem(AUTH_USER_KEY), null);
    assert.deepEqual(events, [AUTH_CHANGED_EVENT]);
  });
});

test("clearStoredAuth(false) does not change window.location", () => {
  withMockWindow((windowMock) => {
    clearStoredAuth(false);

    assert.equal(windowMock.location.href, "/current");
  });
});

test("notifyAuthChanged dispatches the existing auth event name", () => {
  withMockWindow((_, events) => {
    notifyAuthChanged();

    assert.deepEqual(events, [AUTH_CHANGED_EVENT]);
  });
});
