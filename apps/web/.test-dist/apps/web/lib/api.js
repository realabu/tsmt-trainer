"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.API_URL = void 0;
exports.getApiUrl = getApiUrl;
exports.getApiDocsUrl = getApiDocsUrl;
exports.apiFetch = apiFetch;
exports.API_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:4000";
function getApiUrl(path) {
    if (typeof window !== "undefined" && path.startsWith("/api/")) {
        return path;
    }
    return `${exports.API_URL}${path}`;
}
function getApiDocsUrl() {
    return getApiUrl("/api/docs");
}
function clearAuthAndRedirectHome() {
    if (typeof window === "undefined") {
        return;
    }
    window.localStorage.removeItem("tsmt.accessToken");
    window.localStorage.removeItem("tsmt.refreshToken");
    window.localStorage.removeItem("tsmt.user");
    window.dispatchEvent(new Event("tsmt-auth-changed"));
    window.location.href = "/";
}
async function apiFetch(path, init, accessToken) {
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
            const body = (await response.json());
            if (Array.isArray(body.message)) {
                message = body.message.join(", ");
            }
            else if (body.message) {
                message = body.message;
            }
        }
        catch { }
        if (response.status === 401 &&
            accessToken &&
            (message === "Invalid or expired access token" || message === "Missing Authorization header")) {
            clearAuthAndRedirectHome();
        }
        throw new Error(message);
    }
    return (await response.json());
}
