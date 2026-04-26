"use client";
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.setStoredAuthUser = setStoredAuthUser;
exports.clearStoredAuth = clearStoredAuth;
function setStoredAuthUser(user) {
    window.localStorage.setItem("tsmt.user", JSON.stringify(user));
    window.dispatchEvent(new Event("tsmt-auth-changed"));
}
function clearStoredAuth(redirectToHome = true) {
    window.localStorage.removeItem("tsmt.accessToken");
    window.localStorage.removeItem("tsmt.refreshToken");
    window.localStorage.removeItem("tsmt.user");
    window.dispatchEvent(new Event("tsmt-auth-changed"));
    if (redirectToHome) {
        window.location.href = "/";
    }
}
