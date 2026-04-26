"use client";

import { useState } from "react";
import { apiFetch } from "../lib/api";
import {
  clearStoredAuth,
  setStoredAuthTokens,
  setStoredAuthUser,
  type StoredAuthUser,
} from "../lib/auth-storage";
import { useAuthUser } from "../lib/use-auth-user";

type AuthMode = "login" | "register";
type RegisterRole = "PARENT" | "TRAINER";

interface AuthResponse {
  user: StoredAuthUser;
  accessToken: string;
  refreshToken: string;
}

export function AuthPanel({ embedded = false }: { embedded?: boolean }) {
  const user = useAuthUser();
  const [mode, setMode] = useState<AuthMode>("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [role, setRole] = useState<RegisterRole>("PARENT");
  const [status, setStatus] = useState(
    "Jelentkezz be vagy hozz letre egy uj fiokot a folytatashoz.",
  );
  const [busy, setBusy] = useState(false);
  const description = "Jelentkezz be vagy hozz letre egy uj fiokot a motivalt otthoni TSMT gyakorlashoz.";

  async function submit() {
    setBusy(true);
    setStatus("Folyamatban...");

    try {
      const payload =
        mode === "login"
          ? { email, password }
          : { email, password, firstName, lastName, role };

      const result = await apiFetch<AuthResponse>(
        mode === "login" ? "/api/auth/login" : "/api/auth/register",
        {
          method: "POST",
          body: JSON.stringify(payload),
        },
      );

      setStoredAuthTokens(result.accessToken, result.refreshToken);
      setStoredAuthUser(result.user);
      setStatus(`Bejelentkezve: ${result.user.firstName} ${result.user.lastName}`);
      window.location.href = "/";
    } catch (error) {
      setStatus(error instanceof Error ? error.message : "Auth hiba");
    } finally {
      setBusy(false);
    }
  }

  function logout() {
    clearStoredAuth();
  }

  return (
    <div className={embedded ? undefined : "list-card"} style={embedded ? { marginTop: 24 } : undefined}>
      <div className="auth-tabs">
        <button
          className={`auth-tab ${mode === "login" ? "active" : ""}`}
          onClick={() => setMode("login")}
          type="button"
        >
          Bejelentkezes
        </button>
        <button
          className={`auth-tab ${mode === "register" ? "active" : ""}`}
          onClick={() => setMode("register")}
          type="button"
        >
          Regisztracio
        </button>
      </div>
      <p className="muted">{description}</p>
      {user ? (
        <div className="list-item" style={{ marginTop: 12 }}>
          <strong>
            {user.firstName} {user.lastName}
          </strong>
          <span className="muted">
            {user.email} | szerepkor: {user.role === "PARENT" ? "Szulo" : user.role}
          </span>
          <button className="button secondary" onClick={logout} style={{ marginTop: 12 }} type="button">
            Kijelentkezes
          </button>
        </div>
      ) : null}
      <div className="list" style={{ marginTop: 16, opacity: user ? 0.72 : 1 }}>
        <input value={email} onChange={(event) => setEmail(event.target.value)} placeholder="Email" />
        <input
          value={password}
          onChange={(event) => setPassword(event.target.value)}
          placeholder="Jelszo"
          type="password"
        />
        {mode === "register" ? (
          <>
            <input
              value={firstName}
              onChange={(event) => setFirstName(event.target.value)}
              placeholder="Keresztnév"
            />
            <input
              value={lastName}
              onChange={(event) => setLastName(event.target.value)}
              placeholder="Vezetéknév"
            />
            <select value={role} onChange={(event) => setRole(event.target.value as RegisterRole)}>
              <option value="PARENT">Szülő</option>
              <option value="TRAINER">Trainer</option>
            </select>
          </>
        ) : null}
        <button className="button primary" disabled={busy} onClick={submit} type="button">
          {busy ? "Dolgozom..." : mode === "login" ? "Bejelentkezes" : "Regisztracio"}
        </button>
        <p className="muted">{status}</p>
      </div>
    </div>
  );
}
