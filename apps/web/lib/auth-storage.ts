"use client";

export interface StoredAuthUser {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  role: "PARENT" | "TRAINER" | "ADMIN";
}

export function setStoredAuthUser(user: StoredAuthUser) {
  window.localStorage.setItem("tsmt.user", JSON.stringify(user));
  window.dispatchEvent(new Event("tsmt-auth-changed"));
}

export function clearStoredAuth(redirectToHome = true) {
  window.localStorage.removeItem("tsmt.accessToken");
  window.localStorage.removeItem("tsmt.refreshToken");
  window.localStorage.removeItem("tsmt.user");
  window.dispatchEvent(new Event("tsmt-auth-changed"));

  if (redirectToHome) {
    window.location.href = "/";
  }
}
