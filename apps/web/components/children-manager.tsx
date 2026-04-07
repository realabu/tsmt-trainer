"use client";

import { useEffect, useMemo, useState } from "react";
import { apiFetch } from "../lib/api";
import { useAuthUser } from "../lib/use-auth-user";

interface ChildRecord {
  id: string;
  firstName: string;
  lastName: string;
  birthDate?: string | null;
  notes?: string | null;
  _count?: {
    routines: number;
    sessions: number;
  };
}

interface DeleteImpactRecord {
  entityType: string;
  entityId: string;
  entityLabel: string;
  deletes: Array<{
    label: string;
    count: number;
  }>;
  detaches: Array<{
    label: string;
    count: number;
  }>;
  notes: string[];
}

function formatBirthDate(value?: string | null) {
  return value ? value.slice(0, 10) : "";
}

function ImpactSummary({ impact }: { impact: DeleteImpactRecord }) {
  return (
    <div className="list" style={{ marginTop: 12 }}>
      <p className="muted">
        A torles megerositesevel a kovetkezo adatok erintettek lesznek ennél: <strong>{impact.entityLabel}</strong>
      </p>
      {impact.deletes.filter((item) => item.count > 0).length ? (
        <div className="list-item">
          <strong>Vegleg torlodik</strong>
          {impact.deletes
            .filter((item) => item.count > 0)
            .map((item) => (
              <span className="muted" key={item.label}>
                {item.label}: {item.count}
              </span>
            ))}
        </div>
      ) : null}
      {impact.detaches.filter((item) => item.count > 0).length ? (
        <div className="list-item">
          <strong>Kapcsolat megszunik</strong>
          {impact.detaches
            .filter((item) => item.count > 0)
            .map((item) => (
              <span className="muted" key={item.label}>
                {item.label}: {item.count}
              </span>
            ))}
        </div>
      ) : null}
      {impact.notes.map((note) => (
        <p className="muted" key={note}>
          {note}
        </p>
      ))}
    </div>
  );
}

export function ChildrenManager() {
  const user = useAuthUser();
  const isTrainer = user?.role === "TRAINER";
  const [children, setChildren] = useState<ChildRecord[]>([]);
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [birthDate, setBirthDate] = useState("");
  const [notes, setNotes] = useState("");
  const [editingChildId, setEditingChildId] = useState("");
  const [editingFirstName, setEditingFirstName] = useState("");
  const [editingLastName, setEditingLastName] = useState("");
  const [editingBirthDate, setEditingBirthDate] = useState("");
  const [editingNotes, setEditingNotes] = useState("");
  const [deleteImpact, setDeleteImpact] = useState<DeleteImpactRecord | null>(null);
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

  const editingChild = useMemo(
    () => children.find((child) => child.id === editingChildId) ?? null,
    [children, editingChildId],
  );

  function openEdit(child: ChildRecord) {
    setEditingChildId(child.id);
    setEditingFirstName(child.firstName);
    setEditingLastName(child.lastName);
    setEditingBirthDate(formatBirthDate(child.birthDate));
    setEditingNotes(child.notes ?? "");
    setDeleteImpact(null);
  }

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
            notes: notes || undefined,
          }),
        },
        accessToken,
      );
      setFirstName("");
      setLastName("");
      setBirthDate("");
      setNotes("");
      await loadChildren();
      setStatus("Gyerek letrehozva.");
    } catch (error) {
      setStatus(error instanceof Error ? error.message : "Letrehozasi hiba");
    }
  }

  async function saveChild() {
    const accessToken = window.localStorage.getItem("tsmt.accessToken");
    if (!accessToken || !editingChild) {
      return;
    }

    try {
      await apiFetch(
        `/api/children/${editingChild.id}`,
        {
          method: "PATCH",
          body: JSON.stringify({
            firstName: editingFirstName || undefined,
            lastName: editingLastName || undefined,
            birthDate: editingBirthDate || undefined,
            notes: editingNotes || undefined,
          }),
        },
        accessToken,
      );
      setEditingChildId("");
      await loadChildren();
      setStatus("Gyerek adatai frissitve.");
    } catch (error) {
      setStatus(error instanceof Error ? error.message : "Mentési hiba");
    }
  }

  async function requestDeleteImpact(childId: string) {
    const accessToken = window.localStorage.getItem("tsmt.accessToken");
    if (!accessToken) {
      return;
    }

    try {
      const result = await apiFetch<DeleteImpactRecord>(`/api/children/${childId}/delete-impact`, undefined, accessToken);
      setDeleteImpact(result);
      setEditingChildId("");
      setStatus("Torlesi elonezet betoltve.");
    } catch (error) {
      setStatus(error instanceof Error ? error.message : "Nem sikerult betolteni a torlesi elonezetet.");
    }
  }

  async function confirmDeleteChild() {
    const accessToken = window.localStorage.getItem("tsmt.accessToken");
    if (!accessToken || !deleteImpact) {
      return;
    }

    try {
      await apiFetch(`/api/children/${deleteImpact.entityId}`, { method: "DELETE" }, accessToken);
      setDeleteImpact(null);
      await loadChildren();
      setStatus("Gyerek torolve.");
    } catch (error) {
      setStatus(error instanceof Error ? error.message : "Nem sikerult torolni a gyereket.");
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
          <input type="date" value={birthDate} onChange={(event) => setBirthDate(event.target.value)} />
          <textarea value={notes} onChange={(event) => setNotes(event.target.value)} placeholder="Megjegyzes" />
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
              {child.birthDate ? <span className="muted">Szuletesi datum: {formatBirthDate(child.birthDate)}</span> : null}
              {child.notes ? <span className="muted">{child.notes}</span> : null}
              <div style={{ marginTop: 12 }}>
                <button className="button secondary" onClick={() => openEdit(child)} type="button">
                  Szerkesztes
                </button>
                <button
                  className="button secondary"
                  onClick={() => requestDeleteImpact(child.id)}
                  style={{ marginLeft: 8 }}
                  type="button"
                >
                  Torles
                </button>
              </div>

              {editingChildId === child.id ? (
                <div className="list" style={{ marginTop: 16 }}>
                  <input
                    value={editingFirstName}
                    onChange={(event) => setEditingFirstName(event.target.value)}
                    placeholder="Keresztnev"
                  />
                  <input
                    value={editingLastName}
                    onChange={(event) => setEditingLastName(event.target.value)}
                    placeholder="Vezeteknev"
                  />
                  <input
                    type="date"
                    value={editingBirthDate}
                    onChange={(event) => setEditingBirthDate(event.target.value)}
                  />
                  <textarea
                    value={editingNotes}
                    onChange={(event) => setEditingNotes(event.target.value)}
                    placeholder="Megjegyzes"
                  />
                  <div className="cta-row">
                    <button className="button primary" onClick={saveChild} type="button">
                      Valtozasok mentese
                    </button>
                    <button className="button secondary" onClick={() => setEditingChildId("")} type="button">
                      Megse
                    </button>
                  </div>
                </div>
              ) : null}

              {deleteImpact?.entityId === child.id ? (
                <div className="list-card" style={{ marginTop: 16, borderRadius: 20, padding: 18 }}>
                  <h2 style={{ fontSize: "1.05rem" }}>Gyerek torlese</h2>
                  <ImpactSummary impact={deleteImpact} />
                  <div className="cta-row" style={{ marginTop: 12 }}>
                    <button className="button primary" onClick={confirmDeleteChild} type="button">
                      Vegleges torles
                    </button>
                    <button className="button secondary" onClick={() => setDeleteImpact(null)} type="button">
                      Megse
                    </button>
                  </div>
                </div>
              ) : null}
            </div>
          ))}
          {children.length === 0 ? <p className="muted">Meg nincs sajat gyerek rekord.</p> : null}
        </div>
      </section>
    </div>
  );
}
