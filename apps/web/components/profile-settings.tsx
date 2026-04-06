"use client";

import { useEffect, useState } from "react";
import { clearStoredAuth, setStoredAuthUser, type StoredAuthUser } from "../lib/auth-storage";
import { apiFetch } from "../lib/api";
import { useAuthUser } from "../lib/use-auth-user";

interface ProfileResponse extends StoredAuthUser {
  createdAt?: string;
}

export function ProfileSettings() {
  const user = useAuthUser();
  const [email, setEmail] = useState("");
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [password, setPassword] = useState("");
  const [status, setStatus] = useState("Itt tudod frissiteni a sajat fiokod adatait.");
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (!user) {
      return;
    }

    setEmail(user.email);
    setFirstName(user.firstName);
    setLastName(user.lastName);
  }, [user]);

  async function saveProfile() {
    const accessToken = window.localStorage.getItem("tsmt.accessToken");
    if (!accessToken) {
      setStatus("A profil modositasahoz ujra be kell jelentkezni.");
      return;
    }

    setBusy(true);
    setStatus("Profil mentese...");

    try {
      const result = await apiFetch<ProfileResponse>(
        "/api/auth/me",
        {
          method: "PATCH",
          body: JSON.stringify({
            email,
            firstName,
            lastName,
            password: password || undefined,
          }),
        },
        accessToken,
      );

      setStoredAuthUser({
        id: result.id,
        email: result.email,
        firstName: result.firstName,
        lastName: result.lastName,
        role: result.role,
      });
      setPassword("");
      setStatus("A profil adatai sikeresen frissultek.");
    } catch (error) {
      setStatus(error instanceof Error ? error.message : "Nem sikerult menteni a profil adatokat.");
    } finally {
      setBusy(false);
    }
  }

  if (!user) {
    return (
      <main className="shell">
        <section className="panel">
          <h1>Sajat profil</h1>
          <p className="muted">A profilod megtekintesehez jelentkezz be.</p>
        </section>
      </main>
    );
  }

  return (
    <main className="shell">
      <section className="panel">
        <div className="split-row">
          <div>
            <span className="eyebrow">Sajat profil</span>
            <h1 className="hero-title" style={{ marginTop: 14 }}>
              Fiokadatok es kijelentkezes
            </h1>
            <p className="muted" style={{ maxWidth: 760 }}>
              Itt tudod frissiteni a nevedet, emailedet es jelszavadat, illetve innen tudsz biztonsagosan kijelentkezni.
            </p>
          </div>
        </div>
      </section>

      <section className="list-grid" style={{ marginTop: 24 }}>
        <div className="list-card">
          <h2>Profil adatok</h2>
          <div className="list" style={{ marginTop: 16 }}>
            <input value={firstName} onChange={(event) => setFirstName(event.target.value)} placeholder="Keresztnév" />
            <input value={lastName} onChange={(event) => setLastName(event.target.value)} placeholder="Vezetéknév" />
            <input value={email} onChange={(event) => setEmail(event.target.value)} placeholder="Email" />
            <input
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              placeholder="Uj jelszo (opcionalis)"
              type="password"
            />
            <button className="button primary" disabled={busy} onClick={saveProfile} type="button">
              {busy ? "Mentem..." : "Profil mentese"}
            </button>
            <p className="muted">{status}</p>
          </div>
        </div>

        <div className="list-card">
          <h2>Fiok allapot</h2>
          <div className="list" style={{ marginTop: 16 }}>
            <div className="list-item">
              <strong>
                {user.firstName} {user.lastName}
              </strong>
              <span className="muted">{user.email}</span>
              <span className="muted">
                Szerepkor: {user.role === "PARENT" ? "Szulo" : user.role === "TRAINER" ? "Trainer" : "Admin"}
              </span>
            </div>
            <button className="button secondary" onClick={() => clearStoredAuth()} type="button">
              Kijelentkezes
            </button>
          </div>
        </div>
      </section>
    </main>
  );
}
