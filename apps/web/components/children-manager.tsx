"use client";

import { useEffect, useState } from "react";
import { apiFetch } from "../lib/api";
import { useAuthUser } from "../lib/use-auth-user";

interface ChildRecord {
  id: string;
  firstName: string;
  lastName: string;
  birthDate?: string | null;
  _count?: {
    routines: number;
    sessions: number;
  };
}

export function ChildrenManager() {
  const user = useAuthUser();
  const isTrainer = user?.role === "TRAINER";
  const [children, setChildren] = useState<ChildRecord[]>([]);
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [birthDate, setBirthDate] = useState("");
  const [status, setStatus] = useState("A betolteshez eloszor jelentkezz be a fooldalon.");

  async function loadChildren() {
    const accessToken = window.localStorage.getItem("tsmt.accessToken");
    if (!accessToken) {
      setStatus("Nincs access token. Jelentkezz be elobb.");
      return;
    }

    try {
      const result = await apiFetch<ChildRecord[]>("/api/children", undefined, accessToken);
      setChildren(result);
      setStatus(`Betoltve ${result.length} gyerek.`);
    } catch (error) {
      setStatus(error instanceof Error ? error.message : "Betoltesi hiba");
    }
  }

  useEffect(() => {
    void loadChildren();
  }, []);

  async function createChild() {
    const accessToken = window.localStorage.getItem("tsmt.accessToken");
    if (!accessToken) {
      setStatus("Nincs access token. Jelentkezz be elobb.");
      return;
    }

    try {
      await apiFetch<ChildRecord>(
        "/api/children",
        {
          method: "POST",
          body: JSON.stringify({
            firstName,
            lastName,
            birthDate: birthDate || undefined,
          }),
        },
        accessToken,
      );
      setFirstName("");
      setLastName("");
      setBirthDate("");
      await loadChildren();
    } catch (error) {
      setStatus(error instanceof Error ? error.message : "Letrehozasi hiba");
    }
  }

  if (isTrainer) {
    return (
      <section className="list-card" style={{ marginTop: 24 }}>
        <h2>Trainer olvaso mod</h2>
        <p className="muted">
          A trainer szerepkoru fiokoknal a gyerekkezelesi funkciok nem jelennek meg ezen az oldalon.
          A hozzad rendelt eseteket a trainer nezetben latod.
        </p>
      </section>
    );
  }

  return (
    <div className="list-grid" style={{ marginTop: 24 }}>
      <section className="list-card">
        <h2>Uj gyerek</h2>
        <div className="list">
          <input value={firstName} onChange={(event) => setFirstName(event.target.value)} placeholder="Keresztnev" />
          <input value={lastName} onChange={(event) => setLastName(event.target.value)} placeholder="Vezeteknev" />
          <input value={birthDate} onChange={(event) => setBirthDate(event.target.value)} placeholder="Szuletesi datum (YYYY-MM-DD)" />
          <button className="button primary" onClick={createChild} type="button">
            Gyerek letrehozasa
          </button>
          <p className="muted">{status}</p>
        </div>
      </section>

      <section className="list-card">
        <h2>Sajat gyerekek</h2>
        <div className="list">
          {children.map((child) => (
            <div className="list-item" key={child.id}>
              <strong>
                {child.firstName} {child.lastName}
              </strong>
              <span className="muted">
                Feladatsorok: {child._count?.routines ?? 0}, tornak: {child._count?.sessions ?? 0}
              </span>
            </div>
          ))}
          {children.length === 0 ? <p className="muted">Meg nincs sajat gyerek rekord.</p> : null}
        </div>
      </section>
    </div>
  );
}
