"use client";

export interface StoredAuthUser {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  role: "PARENT" | "TRAINER" | "ADMIN";
}

export const AUTH_ACCESS_TOKEN_KEY = "tsmt.accessToken";
export const AUTH_REFRESH_TOKEN_KEY = "tsmt.refreshToken";
export const AUTH_USER_KEY = "tsmt.user";
export const AUTH_CHANGED_EVENT = "tsmt-auth-changed";

export function notifyAuthChanged() {
  window.dispatchEvent(new Event(AUTH_CHANGED_EVENT));
}

export function getStoredAccessToken() {
  return window.localStorage.getItem(AUTH_ACCESS_TOKEN_KEY);
}

export function getStoredRefreshToken() {
  return window.localStorage.getItem(AUTH_REFRESH_TOKEN_KEY);
}

export function setStoredAuthTokens(accessToken: string, refreshToken: string) {
  window.localStorage.setItem(AUTH_ACCESS_TOKEN_KEY, accessToken);
  window.localStorage.setItem(AUTH_REFRESH_TOKEN_KEY, refreshToken);
}

export function setStoredAuthUser(user: StoredAuthUser) {
  window.localStorage.setItem(AUTH_USER_KEY, JSON.stringify(user));
  notifyAuthChanged();
}

export function getStoredAuthUser() {
  try {
    const raw = window.localStorage.getItem(AUTH_USER_KEY);
    if (!raw) {
      return null;
    }

    return JSON.parse(raw) as StoredAuthUser;
  } catch {
    return null;
  }
}

export function clearStoredAuth(redirectToHome = true) {
  window.localStorage.removeItem(AUTH_ACCESS_TOKEN_KEY);
  window.localStorage.removeItem(AUTH_REFRESH_TOKEN_KEY);
  window.localStorage.removeItem(AUTH_USER_KEY);
  notifyAuthChanged();

  if (redirectToHome) {
    window.location.href = "/";
  }
}
